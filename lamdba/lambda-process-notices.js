/*
 * this code is scheduled via EventBridge and retrieves notices to be sent
 *
 * change log
 * ----------
 * v1.0.4 updated schema and layers, sending email with s3 addendum works (but code is hardcoded to a date for testing)
 * v1.0.3 basic version works on email
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";

const goModify = true; //set to true to enable actual db operations

const sendNotice = async (notice) => {
  owd.log(notice, "\nSending notice for:", false);

  // get the document details
  const docDetails = notice.documentId.S.split("|");
  const docDb = await db.getItem("db-document", docDetails[0], docDetails[1]);
  owd.log(docDb, "\nRetrieved document details:", false);

  // get the customer details
  const customerDb = await db.getItem("db-customer", notice.cid.S);
  owd.log(customerDb, "\nRetrieved customer details:", false);

  // construct the email and text message
  ch.setModify(true);

  const inDays = owd.getFriendlyDateDifference(new Date(), notice.originalExpiryOn.S);

  //const fileKey = e.g., "travel#us#passport.md";
  const fileKey = "db/" + docDb.pk.S + "#" + docDb.sk.S + ".md";
  owd.log(fileKey, "The S3 file key: and refDoc == " + docDb.refDoc.BOOL, false);

  const refContent = docDb.refDoc.BOOL === true ? await db.getS3Text("onwhichdate", fileKey) : "";

  const d = {
    name: customerDb.nickName.S,
    notes: notice.notes.S,
    documentName: docDb.documentName.S,
    dueInDays: inDays.dueInSentence,
    dueDate: owd.getFriendlyDate(notice.originalExpiryOn.S),
    referenceLinks: owd.getHtmlFromMarkdown(refContent),
  };

  if (goModify) {
    const r = await ch.sendEmail("notice@onwhichdate.com", "m.venugopal@gmail.com", "Notice", d);
  }
};

export const handler = async (event, context) => {
  owd.log(owd.getVersion(), "\nLib version (note: goModify = " + goModify + ")");
  owd.log(event, `\n${context.functionName}: received event`);

  try {
    // Validate input parameters
    // construct the pk which is the date and hour
    const date = new Date();
    const hour = date.getHours().toString().padStart(2, "0");
    let pk = date.toISOString().split("T")[0] + "#" + hour;
    pk = "2028-10-08#23"; //for testing

    // get all records from the db-notice table that are due to be sent
    const notices = await db.queryItems("db-notice", "pk", "pk = :pk", { ":pk": { S: pk } });

    // loop through the notices and send them
    for (const notice of notices) {
      owd.log(notice, "\nRetrieved notice details:", true);
      await sendNotice(notice);
    }
  } catch (error) {
    console.error(error);

    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to send email", event: JSON.stringify(event) }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
