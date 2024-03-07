/*
 * this code adds notices based on the reminder offsets of a document
 *
 * change log
 * ----------
 * v1.0.2 - layer updated, code updated for revised schema
 * v1.0.1 basic version works through test and POST
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

const goModify = true; //set to true to enable actual db operations

export const handler = async (event, context) => {
  owd.log(owd.getVersion(), "\nLib version (note: goModify = " + goModify + ")");
  owd.log(event.body);
  const body = JSON.parse(event.body);
  const { cid, docId, expiresOn } = body;

  try {
    // Validate input parameters
    if (!cid || !expiresOn) {
      throw new Error("Missing required parameters.");
    }

    const customerDb = await db.getItem("db-customer", cid);

    if (!customerDb) {
      throw new Error("Customer not found.");
    }
    owd.log(customerDb, "\nRetrieved customer details:", true);

    let [pk, sk] = docId.split("|");
    const docDb = await db.getItem("db-document", pk, sk);
    if (!docDb) {
      throw new Error("Document not found.");
    }
    owd.log(docDb, "\nRetrieved document details:", true);

    const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    const newDates = await createAndInsertNotices(offsetArray, docDb);
    const retJson = { notices: newDates };

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
    const ret = [];

    for (const date of newDates) {
      const hour = new Date().getHours().toString().padStart(2, "0");
      const pk = date.date + "#" + hour;
      const sk = owd.getShortId();
      const noticeItem = {
        pk: { S: pk },
        sk: { S: sk }, //the shortId ensures uniqueness
        cid: { S: cid },
        isAlreadySent: { BOOL: false },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: date.offsetNumber === 0 },
        originalExpiryOn: { S: newDates[0].date },
        documentId: { S: docDb.pk.S + "|" + docDb.sk.S },
        sendSMS: { BOOL: body.sendSMS },
        sendEmail: { BOOL: body.sendEmail },
        sendPush: { BOOL: body.sendPush },
        sendWhatsapp: { BOOL: body.sendWhatsapp },
        alsoCC: { BOOL: body.alsoCC },
        daysRemaining: { N: date.dueInDays },
        notes: { S: body.notes },
      };

      owd.log(noticeItem, "\nConstructed notice entry for:", true);
      if (goModify) {
        const resp = await db.putItem("db-notice", noticeItem);
        owd.log(resp, "\nAdded notice to db:", false);
      } else {
        owd.log("Skipping actual db operation", "\n", true);
      }

      ret.push({
        id: pk + "|" + sk,
        date: date,
      });
    }
    return ret;
  }
};
