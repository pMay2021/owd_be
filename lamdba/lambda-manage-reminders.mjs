/*
 * this code manages (add, delete, update) notices
 * add: when customer adds a document, notices are created for the expiry dates
 * delete: when customer deletes a document, all notices are deleted, or deletes a specific notice
 * update: when customer updates a specific notice
 * We do not support update of the expiry date of the document, as that would require a cascade update of all notices
 *
 * change log
 * ----------
 * v1.0.7 - cleanups, authorizer mgmt. add, delete, update, and get work
 * v1.0.6 - now with new db layer with PartiQL, support for get
 * v1.0.5 - new layer, better error check on delete
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

  let obj = event.requestContext.authorizer.lambda.item;
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
  const { email, cid } = obj;
  const { docId, expiresOn } = body;

  try {
    if (command === "add") {
      if (!cid || !expiresOn) {
        throw new Error("Missing required parameters. (cid)");
      }

      const customerDb = await db.getItem("db-customer", cid);
      if (!customerDb) return owd.Response(404, { message: "Customer not found", email: email });

      owd.debug(customerDb, "Retrieved customer details:");

      let [dpk, dsk] = docId.split("|");
      const docDb = await db.getItem("db-document", dpk, dsk);
      if (!docDb) {
        return owd.Response(404, { message: "Document not found", docId: dpk + " " + dsk });
      }
      owd.debug(docDb, "Retrieved document details:");

      const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
      const newDates = await createAndInsertNotices(offsetArray, docDb);
      const retJson = { notices: newDates };
      const nd = newDates?.map((m) => m.date.date + " | " + m.date.dueInDays);
      owd.info(nd, "Constructed new dates");
      return owd.Response(200, retJson);
    }

    if (command === "delete") {
      //delete a specific notice
      const { id } = event.queryStringParameters;
      if (!id) return owd.Response(400, "Missing/Invalid id");

      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) return owd.Response(404, { message: "Notice not found", id: id });

      if (cid != noticeDb.cid.S) {
        return owd.Response(404, { message: "Customer/notice mismatch; verification failed " });
      }

      //TODO if it's a parent, then we delete all children

      if (goModify) {
        const resp = await db.deleteItem("db-notices", id);
        owd.info(resp, "Deleted notice from db:");
      } else {
        owd.debug("Skipping actual db operation", "");
      }
      return owd.Response(200, { message: "Deleted notice: ", id: id });
    }

    if (command === "update") {
      const { id } = event.queryStringParameters;
      if (!id) return owd.Response(400, { message: "Missing/Invalid id", id: id });

      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) return owd.Response(404, { message: "Missing/Invalid notice", id: id });

      const daysRemainingObj = owd.getFriendlyDateDifference(body.date, noticeDb.originalExpiryOn.S);
      owd.log(daysRemainingObj, "daysRemainingObj");

      const noticeItem = {
        slot: { S: body.date + "#" + hour },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: daysRemainingObj.isToday },
        alsoCC: { BOOL: body.alsoCC },
        dueInDays: { N: daysRemainingObj.totalDaysDifference + "" },
        notes: { S: body.notes },
      };

      owd.debug(noticeItem, "constructed noticeItem");

      if (goModify) {
        const resp = await db.updateItem("db-notices", noticeItem, id);
        return owd.Response(200, "successfully updated record");
      } else {
        owd.debug("Skipping actual db operation", "");
        return owd.Response(200, "skipped update/but successful operation");
      }
    }

    if (command === "get") {
      //TODO for now we don't limit reads, we'll pull all parent notices
      const { n } = event.queryStringParameters;
      const items = await db.getParentNoticesByCid(cid);
      if (!items || items.Count === 0) return owd.Response(404, "No data for customer");
      const ret = items
        ?.map((n) => {
          const i = {
            doc: n.documentId.S,
            expires: n.originalExpiryOn.S,
            dueIn: n.dueInDays.N,
            id: n.pk.S,
            parentId: n.parentKey.S,
            type: n.type.S,
          };

          return i;
        })
        .filter((f) => f.type == "notice");

      return owd.Response(200, ret);
    }

    return owd.Response(404, { message: "unknown command", event: event });
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
    const type = "notice";
    let parentKey = "";

    for (const date of newDates) {
      const slot = date.date + "#" + hour + "#" + type; //e.g., 2028_11_28#21#notice; with this we can only query notices by type and slot
      const pk = owd.getShortId(25);
      if (date.display.isToday && date.dueInDays == "0") parentKey = pk;

      const noticeItem = {
        pk: { S: pk },
        cid: { S: cid },
        parentKey: { S: parentKey },
        slot: { S: slot },
        type: { S: type },
        isAlreadySent: { BOOL: false },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: date.dueInDays === "0" },
        originalExpiryOn: { S: newDates[0].date },
        documentId: { S: docDb.pk.S + "|" + docDb.sk.S },
        sendSMS: { BOOL: body.sendSMS },
        sendEmail: { BOOL: body.sendEmail },
        sendPush: { BOOL: body.sendPush },
        sendWhatsapp: { BOOL: body.sendWhatsapp },
        alsoCC: { BOOL: body.alsoCC },
        notes: { S: body.notes },
        dueInDays: { N: date.dueInDays },
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
