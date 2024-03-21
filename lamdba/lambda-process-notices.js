/*
 * this code is scheduled via EventBridge and retrieves notices to be sent
 *
 * change log
 * ----------
 * v1.0.8 now works! still hardcoded but fundamentals work
 * v1.0.7 testing with new layer and db methods
 * v1.0.6 updated to new layer constructs, schemas, logging
 * v1.0.5 handling edge cases, today
 * v1.0.4 updated schema and layers, sending email with s3 addendum works (but code is hardcoded to a date for testing)
 * v1.0.3 basic version works on email
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";

const goModify = process.env.DB_MODIFY === "TRUE";
const logLevel = process.env.LOG_LEVEL || "DEBUG";
const devEmail = "m.venugopal@gmail.com";
const jwtSecretKey = "/JWT/general-access-token";

const sendNotice = async (notice) => {
  owd.log(notice, "Sending notice for:");

  const { S: documentId } = notice.documentId;
  const docDb = await db.getItem("db-document", ...documentId.split("|"));

  const customerDb = await db.getItem("db-customer", notice.cid.S);

  const inDays = owd.getFriendlyDateDifference(new Date(), notice.originalExpiryOn.S);

  const fileKey = `db/${docDb.pk.S}#${docDb.sk.S}.md`;
  //owd.log(fileKey, `The S3 file key: and refDoc == ${docDb.refDoc.BOOL}`);

  const refContent = docDb.refDoc.BOOL ? await db.getS3Text("onwhichdate", fileKey) : "";

  const token = await db.encodeJWT(customerDb.pk.S, jwtSecretKey, "1");

  const d = {
    name: customerDb.nickName.S,
    notes: notice.notes.S,
    documentName: docDb.documentName.S,
    dueInDays: inDays.dueInSentence,
    dueDate: owd.getFriendlyDate(notice.originalExpiryOn.S),
    editMagicLink: `https://onwhichdate.com/reminders/edit?id=${notice.parentKey.S}&email=${customerDb.email.S}&token=${token}`,
    referenceNotes: owd.getHtmlFromMarkdown(refContent),
  };

  owd.log(d, "Preparing to send notice");

  if (goModify && !notice.isAlreadySent.BOOL) {
    console.log("Sending email");
    const r = inDays.isToday
      ? await ch.sendEmail("notice@onwhichdate.com", devEmail, "NoticeForToday", d)
      : await ch.sendEmail("notice@onwhichdate.com", devEmail, "ReminderNotice", d);
    owd.log(r, "Email response:");
  }
};

export const handler = async (event, context) => {
  try {
    owd.log(owd.getVersion(), `Lib version (note: goModify = ${goModify})`);
    owd.log(db.getVersion(), `DB version`);
    owd.log(event, `\n${context.functionName}: received event`);

    const date = new Date();
    const hour = date.getHours().toString().padStart(2, "0");
    let pk = date.toISOString().split("T")[0] + "#" + hour + "#notice";
    pk = "2028-10-08#23#notice"; //for testing
    pk = "2029-08-25#03#notice";

    const notices = await db.getNoticesBySlot(pk);

    for (const notice of notices) {
      owd.log(notice, "Preparing to send notice");

      if (notice.isAlreadySent.BOOL) {
        owd.log(notice.pk.S, "already sent, not resending comms again.");
        continue;
      }

      await sendNotice(notice);

      //update the alreadySent
      const item = {
        isAlreadySent: { BOOL: true },
      };

      await db.updateItem("db-notices", item, notice.pk.S);
    }
    return owd.Response(200, "success");
  } catch (error) {
    console.error(error.message);
    owd.Response(500, { message: `Failed to process notices: ${error.message}`, event: JSON.stringify(event) });
  }
};
