import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

/*
 * This code manages (add, delete, update) notices. Queries are handled by a separate lambda.
 * Add: when a customer adds a document, notices are created for the expiry dates.
 * Delete: when a customer deletes a document, all notices are deleted, or deletes a specific notice.
 * Update: when a customer updates a specific notice.
 * We do not support updating the expiry date of the document, as that would require a cascade update of all notices.
 *
 * Change log:
 * ----------
 * v1.2.1 - ongoing, DELETE in progress
 * v1.2.0 - removed GET; functions here are for modifications only
 * v1.1.0 - updating for new API
 * v1.0.9 - added service field
 * v1.0.8 - additional cleanup, minor fixes.
 * v1.0.7 - cleanups, authorizer management. Add, delete, update, and get work.
 * v1.0.6 - now with new db layer with PartiQL, support for get.
 * v1.0.5 - new layer, better error check on delete.
 * v1.0.4 - delete and update code, change in schema; delete and update work.
 * v1.0.3 - logging improvements and minor fixes, notice additions work; add works, need to extend to commands with add, delete, update.
 * v1.0.2 - layer updated, code updated for revised schema.
 * v1.0.1 - basic version works through test and POST.
 */

const goModify = process.env.DB_MODIFY === "TRUE";
const logLevel = process.env.LOG_LEVEL || "DEBUG"; // Set to true to enable actual db operations

export const handler = async (event, context) => {
  const method = event.requestContext.http.method;
  const qsp = event.queryStringParameters;
  let auth = event.requestContext.authorizer.lambda;

  //the authorizer tells us whether to proceed or not
  if (!auth.isAuthorized) {
    return owd.Response(401, auth.details);
  }

  const { email, cid, isVerified } = auth.details;

  // Extract the variables based on the command

  const hour = new Date().getHours().toString().padStart(2, "0");
  const runDisplay = {
    libVersion: owd.getVersion(),
    dbVersion: db.getVersion(),
    logLevel: logLevel,
    dbOps: goModify,
  };

  owd.info(runDisplay, "Execution Variables");
  const body = event.body ? JSON.parse(event.body) : {};
  const { docId, expiresOn } = body ?? { docId: "", expiresOn: "0000-00-00" };
  let obj = { status: 200, content: "" };
  let { status, content } = obj;

  try {
    // Add a new parent due date
    if (method === "POST") {
      owd.Response(200, "we came to post");

      if (!cid || !expiresOn) {
        throw new Error("Missing required parameters (cid or expiresOn)");
      }

      const customerDb = await db.getItem("db-customer", cid);
      if (!customerDb) {
        throw new Error(`Customer ${cid} not found`);
      }

      const [dpk, dsk] = docId.split("|");

      const docDb = await db.getItem("db-document", dpk, dsk);
      if (!docDb) {
        throw new Error(`Document ${docId} not found`);
      }

      const offsetArray = docDb.reminderOffsetDays?.L?.map((x) => x?.N);
      if (!offsetArray || offsetArray.length === 0) {
        throw new Error("Invalid or empty reminder offset days");
      }

      const newDates = await createAndInsertNotices(offsetArray, expiresOn, docDb.pk.S + "|" + docDb.sk.S, body);

      const retJson = { notices: newDates };
      status = 200;
      content = retJson;
    }

    // Delete a notice; if parent then delete all children
    if (method === "DELETE") {
      const { id } = qsp;

      if (!id) {
        throw new Error("Invalid or empty id");
      }

      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) {
        throw new Error("No record for this id: " + id);
      }

      if (cid !== noticeDb.cid.S) {
        throw new Error("Customer/notice mismatch; verification failed");
      }

      if (goModify) {
        if (noticeDb.isParent.BOOL === false) {
          const resp = await db.deleteItem("db-notices", id);
          return owd.Response(200, "Deleted notice: " + id);
        }

        const children = await db.queryItems("db-notices", "parentKey", "pk", noticeDb.pk.S);
        if (children.length > 0) {
          for (const child of children) {
            const resp = await db.deleteItem("db-notices", child.pk.S);
          }
        }
      } else {
        owd.debug("Skipping actual db operation");
      }

      status = 200;
      content = "Deleted notice: " + id;
    }

    // Update a child notice
    if (method === "PATCH") {
      const { id } = qsp;
      if (!id) {
        throw new Error("Missing/Invalid id");
      }

      const noticeDb = await db.getItem("db-notices", id);
      if (!noticeDb) {
        throw new Error("No record for this id: " + id);
      }

      if (noticeDb.isParent?.BOOL) {
        throw new Error("Updating parent notice disallowed");
      }

      const daysRemainingObj = owd.getFriendlyDateDifference(body.date, noticeDb.originalExpiryOn?.S);

      const noticeItem = {
        slot: { S: body.date + "#" + hour },
        addedOn: { S: new Date().toISOString() },
        dueInDays: { N: daysRemainingObj.totalDaysDifference + "" },
      };

      if (goModify) {
        const resp = await db.updateItem("db-notices", noticeItem, id);
        status = 200;
        content = "Updated notice: " + id;
      } else {
        owd.debug("Skipping actual db operation");
        status = 200;
        content = "Skipped update, but successful operation";
      }
    }

    return owd.Response(status, content);
  } catch (error) {
    owd.error(error.message);
    return owd.Response(400, error.message);
  }

  async function createAndInsertNotices(offsetArray, expiresOn, docId, body) {
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);

    const ret = [];
    const type = "owd#notice"; //the service and type of notice, allows for this table to become common holder for variety of services and notices
    let parentKey = "";

    for (const date of newDates) {
      const slot = date.date + "#" + hour + "#" + type; // e.g., 2028_11_28#21#notice; with this, we can only query notices by type and slot
      const pk = owd.getShortId(25);
      if (date.display.isToday && date.dueInDays === "0") {
        parentKey = pk;
      }

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
        documentId: { S: docId },
        sendSMS: { BOOL: body.sendSMS ?? false },
        sendEmail: { BOOL: body.sendEmail ?? false },
        sendPush: { BOOL: body.sendPush ?? false },
        sendWhatsapp: { BOOL: body.sendWhatsapp ?? false },
        alsoCC: { BOOL: body.alsoCC ?? false },
        notes: { S: body.notes },
        dueInDays: { N: date.dueInDays },
      };

      owd.log(noticeItem, "Constructed notice entry for");
      if (goModify) {
        //    throw new Error(`about to putItem: expiresOn: ${expiresOn}, docId: ${docId} and body: ${JSON.stringify(noticeItem)}`)
        const resp = await db.putItem("db-notices", noticeItem);
        owd.info(resp, "Added notice to db");
      } else {
        owd.debug("Skipping actual db operation");
      }

      ret.push({
        id: pk,
        parentKey: parentKey,
        date: date,
      });
    }
    return ret;
  }
};
