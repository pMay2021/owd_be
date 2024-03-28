import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

/*
 * This code allows clients to query the reminders database. Only the GET method is supported.
 *
 * Change log:
 * ----------
 * v1.0.1 - basic version works through test and POST.
 */

const goModify = process.env.DB_MODIFY === "TRUE";
const logLevel = process.env.LOG_LEVEL || "DEBUG"; // Set to true to enable actual db operations

export const handler = async (event, context) => {
  const qsp = event.queryStringParameters;
  let auth = event.requestContext.authorizer.lambda;
  let routeKey = event.routeKey;

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
  const body = JSON.parse(event.body);
  const { docId, expiresOn } = body;
  let { status, content } = obj;

  try {
    //we'll act based on request type
    //TODO - implement limits in the query

    if (routeKey.endsWith("/parent")) {
      // get parent notices only
      const { limits = -1 } = qsp;
      const items = await db.getParentNoticesByCid(cid);
      if (!items || items.Count === 0) {
        return owd.Response(404, "No data for customer");
      }

      const ret = items
        ?.map((n) => {
          const i = {
            doc: n.documentId?.S,
            expires: n.originalExpiryOn?.S,
            dueIn: n.dueInDays?.N,
            id: n.pk?.S,
            parentId: n.parentKey?.S,
            type: n.type?.S,
          };

          return i;
        })
        .filter((f) => f.type === "owd#notice");

      return owd.Response(404, { message: "Unknown command", event: event });
    }
  } catch (error) {
    owd.error(error.message);
    return owd.Response(500, error.message);
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
        date: date,
      });
    }
    return ret;
  }
};
