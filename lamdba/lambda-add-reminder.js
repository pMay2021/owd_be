/*
 * this code adds notices based on the reminder offsets of a document
 *
 * change log
 * ----------
 * v1.0.1 basic version works through test and POST
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

const goModify = true; //set to true to enable actual db operations

export const handler = async (event, context) => {
  owd.log(owd.getVersion(), "\nLib version (note: goModify = " + goModify + ")");
  owd.log(event.body);
  const body = JSON.parse(event.body);
  const { cid, docId, loc, expiresOn } = body;
  owd.log(event, `\n${context.functionName}: received event`);

  try {
    // Validate input parameters
    if (!cid || !loc || !expiresOn) {
      throw new Error("Missing required parameters.");
    }

    const customerDb = await db.getItem("db-customer", cid);

    if (!customerDb) {
      throw new Error("Customer not found.");
    }
    owd.log(customerDb, "\nRetrieved customer details:", false);

    const docDb = await db.getItem("db-document", docId, loc);
    if (!docDb) {
      throw new Error("Document not found.");
    }
    owd.log(docDb, "\nRetrieved document details:", false);

    const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    const newDates = await createAndInsertNotices(offsetArray, docDb);
    const retJson = { notices: newDates, link: docDb.referenceURL.S };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Added reminders successfully!",
        data: retJson,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
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
