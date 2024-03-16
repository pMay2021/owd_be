/*
 * this code adds notices based on the reminder offsets of a document
 *
 * change log
 * ----------
 * v1.0.3 - logging improvements and minor fixes, notice additions work
 * v1.0.2 - layer updated, code updated for revised schema
 * v1.0.1 basic version works through test and POST
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
const goModify = process.env.DB_MODIFY === "TRUE" ? true : false;

const logLevel = process.env.LOG_LEVEL || "DEBUG"; //set to true to enable actual db operations

export const handler = async (event, context) => {
  owd.info(owd.getVersion(), "\nLib version (note: logLevel = " + logLevel + ")");
  const body = JSON.parse(event.body);
  owd.info(body, "The incoming body");
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
    owd.log(customerDb, "Retrieved customer details:");

    let [pk, sk] = docId.split("|");
    owd.log({ pk: pk, sk: sk }, "pk and sk");
    const docDb = await db.getItem("db-document", pk, sk);
    if (!docDb) {
      return owd.getResponseJSON(404, "Document not found for " + pk + " " + sk);
    }
    owd.log(docDb, "Retrieved document details:");

    const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    console.log("entering create and insert");
    const newDates = await createAndInsertNotices(offsetArray, docDb);
    const retJson = { notices: newDates };
    owd.log(newDates, "constructed new dates");

    return owd.getResponseJSON(200, JSON.stringify(retJson));
  } catch (error) {
    owd.error(error.message);
    return owd.getResponseJSON(500, JSON.stringify(event));
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

      owd.log(noticeItem, "Constructed notice entry for:");
      if (goModify) {
        const resp = await db.putItem("db-notice", noticeItem);
        owd.info(resp, "Added notice to db:");
      } else {
        owd.info("Skipping actual db operation", "");
      }

      ret.push({
        id: pk + "|" + sk,
        date: date,
      });
    }
    return ret;
  }
};
