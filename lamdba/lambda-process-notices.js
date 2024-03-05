/*
 * this code is scheduled via EventBridge and retrieves notices to be sent
 *
 * change log
 * ----------
 * v1.0.1 basic version
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";

const goModify = true; //set to true to enable actual db operations

const sendNotice = async (notice) => {
  owd.log(notice, "\nSending notice for:", true);

  // get the document details
  const docDetails = notice.documentId.S.split("|");
  const docDb = await db.getItem("db-document", docDetails[0], docDetails[1]);
  owd.log(docDb, "\nRetrieved document details:", false);

  // get the customer details
  const customerDb = await db.getItem("db-customer", notice.cid.S);
  owd.log(customerDb, "\nRetrieved customer details:", false);

  // construct the email and text message
  await ch.sendEmail("notice@onwhichdate.com", customerDb.email.S, "Notice", {
    name: customerDb.nickName.S,
    documentName: docDb.title.S,
    dueInDays: notice.daysRemaining.N,
    dueDate: notice.originalExpiryOn.S,
    referenceLinks: docDb.referenceLinks.S,
    notes: notice.notes.S,
  });
};

export const handler = async (event, context) => {
  owd.log(owd.getVersion(), "\nLib version (note: goModify = " + goModify + ")");
  const body = JSON.parse(event.body);
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
};
