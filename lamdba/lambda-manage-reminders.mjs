/*
 * this code manages (add, delete, update) notices
 * add: when customer adds a document, notices are created for the expiry dates
 * delete: when customer deletes a document, all notices are deleted, or deletes a specific notice
 * update: when customer updates a specific notice
 * We do not support update of the expiry date of the document, as that would require a cascade update of all notices
 *
 * change log
 * ----------
 * v1.0.4 - delete and update code, change in schema; delete and update work
 * v1.0.3 - logging improvements and minor fixes, notice additions work; add works, need to extend to commands with add, delete, update
 * v1.0.2 - layer updated, code updated for revised schema
 * v1.0.1 basic version works through test and POST
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
const goModify = process.env.DB_MODIFY === "TRUE" ? true : false;

const logLevel = process.env.LOG_LEVEL || "DEBUG"; //set to true to enable actual db operations

export const handler = async (event, context) => {
  const command = event.pathParameters?.proxy;
  if (!command) return owd.Response(400, "Missing/Invalid command");

  const hour = new Date().getHours().toString().padStart(2, "0");
  const runDisplay = {
    libVersion: owd.getVersion(),
    dbVersion: db.getVersion(),
    logLevel: logLevel,
    dbOps: goModify,
  };

  owd.info(runDisplay, "Execution Variables");
  const body = JSON.parse(event.body);
  owd.info(body, "The incoming body");
  const { cid, docId, expiresOn } = body;
  try {
    if (command === "add") {
      // Validate input parameters
      if (!cid || !expiresOn) {
        throw new Error("Missing required parameters.");
      }

      const customerDb = await db.getItem("db-customer", cid);

      if (!customerDb) return owd.Response(404, "Customer not found");

      owd.debug(customerDb, "Retrieved customer details:");

      let [dpk, dsk] = docId.split("|");
      const docDb = await db.getItem("db-document", dpk, dsk);
      if (!docDb) {
        return owd.Response(404, "Document not found for " + dpk + " " + dsk);
      }
      owd.debug(docDb, "Retrieved document details:");

      const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
      console.debug("entering create and insert");
      const newDates = await createAndInsertNotices(offsetArray, docDb);
      const retJson = { notices: newDates };
      const nd = newDates?.map((m) => m.date.date + " | " + m.date.dueInDays);
      owd.info(nd, "Constructed new dates");
      return owd.Response(200, JSON.stringify(retJson));
    }

    if (command === "delete") {
      //delete a specific notice
      const { id } = body;
      if (!id) return owd.Response(400, "Missing/Invalid id");

      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) return owd.Response(404, "Notice not found");

      if (goModify) {
        const resp = await db.deleteItem("db-notices", id);
        owd.info(resp, "Deleted notice from db:");
      } else {
        owd.debug("Skipping actual db operation", "");
      }
      return owd.Response(200, "Deleted notice: " + id);
    }

    if (command === "update") {
      const id = body.id;
      if (!id) return owd.Response(400, "Missing/Invalid id");
      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) return owd.Response(404, "Notice not found");

      const daysRemainingObj = owd.getFriendlyDateDifference(body.date, noticeDb.originalExpiryOn.S);

      const noticeItem = {
        pk: { S: noticeDb.pk.S },
        slot: { S: body.date + "#" + hour },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: daysRemainingObj.isToday },
        alsoCC: { BOOL: body.alsoCC },
        daysRemaining: { S: JSON.stringify(daysRemainingObj) },
        notes: { S: body.notes },
      };

      const resp = await db.updateItem("db-notices", noticeItem);
      owd.info(resp, "Updated notice in db:");
    } else {
      owd.debug("Skipping actual db operation", "");
    }
  } catch (error) {
    owd.error(error.message);
    const obj = {
      message: error.message,
      event: event,
    };

    return owd.Response(500, JSON.stringify(obj));
  }

  async function createAndInsertNotices(offsetArray, docDb) {
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);
    const ret = [];

    for (const date of newDates) {
      const slot = date.date + "#" + hour;
      const pk = owd.getShortId(25);
      const noticeItem = {
        pk: { S: pk },
        cid: { S: cid },
        slot: { S: slot },
        type: { S: "notice" },
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
        notes: { S: body.notes },
        daysRemaining: { S: JSON.stringify(date) },
      };

      owd.log(noticeItem, "Constructed notice entry for:");
      if (goModify) {
        const resp = await db.putItem("db-notices", noticeItem);
        owd.info(resp, "Added notice to db:");
      } else {
        owd.debug("Skipping actual db operation", "");
      }

      ret.push({
        id: pk,
        date: date,
      });
    }
    return ret;
  }
};
