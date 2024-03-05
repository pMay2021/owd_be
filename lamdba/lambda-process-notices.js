/*
 * this code is scheduled via EventBridge and retrieves notices to be sent
 *
 * change log
 * ----------
 * v1.0.1 basic version
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const goModify = true; //set to true to enable actual db operations

const sendNotice = async (notice) => {
  owd.log(notice, "\nSending notice for:", true);
  // send the notice

  // get the document details
  const docDetails = notice.documentId.S.split("|");
  const docDb = await db.getItem("db-document", docDetails[0], docDetails[1]);
  owd.log(docDb, "\nRetrieved document details:", false);

  // get the customer details
  const customerDb = await db.getItem("db-customer", notice.cid.S);
  owd.log(customerDb, "\nRetrieved customer details:", false);

  // get the notice template

}

export const handler = async (event, context) => {
  const ses = new SESv2Client({ region: "us-east-1" });
  owd.log(owd.getVersion(), "\nLib version (note: goModify = " + goModify + ")");
  const body = JSON.parse(event.body);
  const { cid, docId, loc, expiresOn } = body;
  owd.log(event, `\n${context.functionName}: received event`);

  try {
    // Validate input parameters

    // construct the pk which is the date and hour
    const date = new Date();
    const hour = date.getHours().toString().padStart(2, "0");
    const pk = date.toISOString().split("T")[0] + "#" + hour;

    // get all records from the db-notice table that are due to be sent
    const notices = await db.queryItems("db-notice", "pk", "pk = :pk", { ":pk": { S: pk } });

    // loop through the notices and send them
    for (const notice of notices) {
      owd.log(notice, "\nRetrieved notice details:", false);
      // send the notice
      await sendNotice(notice);
    }
  } catch (error) {
    console.error(error);

    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to retrieve item", event: JSON.stringify(event) }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  async function createAndInsertNotices(offsetArray, docDb) {
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);

    for (const date of newDates) {
      const hour = new Date().getHours().toString().padStart(2, "0");
      const noticeItem = {
        pk: { S: date.date + "#" + hour },
        sk: { S: cid + "#" + owd.getShortId(6) }, //the shortId ensures uniqueness
        cid: { S: cid },
        isAlreadySent: { BOOL: false },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: true },
        originalExpiryOn: { S: newDates[0].date },
        documentId: { S: docDb.pk.S + "|" + docDb.sk.S },
        sendSMS: { BOOL: body.sendSMS },
        sendEmail: { BOOL: body.sendEmail },
        sendPush: { BOOL: body.sendPush },
        sendWhatsapp: { BOOL: body.sendWhatsapp },
        additionalSends: { S: JSON.stringify(body.additionalSends) },
        daysRemaining: { N: date.offsetNumber },
        notes: { S: body.notes },
      };

      owd.log(noticeItem, "\nConstructed notice entry for:", true);
      if (goModify) {
        const resp = await db.putItem("db-notice", noticeItem);
        owd.log(resp, "\nAdded notice to db:", false);
      } else {
        owd.log("Skipping actual db operation", "\n", true);
      }
    }
    return newDates;
  }
};
