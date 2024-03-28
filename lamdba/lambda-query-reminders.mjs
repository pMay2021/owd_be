import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

/*
 * This code allows clients to query the reminders database. Only the GET method is supported.
 *
 * Change log:
 * ----------
 * v1.0.2 - GET /parents/{parentId} works
 * v1.0.1 - GET /parents works
 */

const goModify = process.env.DB_MODIFY === "TRUE";
const logLevel = process.env.LOG_LEVEL || "DEBUG"; // Set to true to enable actual db operations

export const handler = async (event) => {
  const queryParams = event.queryStringParameters;
  const pathParams = event.pathParameters;
  let auth = event.requestContext.authorizer.lambda;
  let routeKey = event.routeKey;

  const { cid } = auth.details;

  // Extract the variables based on the command
  const hour = new Date().getHours().toString().padStart(2, "0");
  const runDisplay = {
    libVersion: owd.getVersion(),
    dbVersion: db.getVersion(),
    logLevel: logLevel,
    dbOps: goModify,
  };

  owd.info(runDisplay, "Execution Variables");

  try {
    //we'll act based on request type
    //TODO - implement limits in the query

    let items;

    //get only the parent notices for a customer
    if (routeKey.endsWith("/parents")) {
      // get parent notices only
      items = await db.getParentNoticesByCid(cid);
    }

    //get all notices for a customer for a specific parent, including the parent notice
    if (pathParams?.parentId) {
      owd.info(`about to get Notices for ${pathParams.parentId} for cid: ${cid}`);
      items = await db.getNoticesByParentId(cid, pathParams.parentId);
    }

    if (!items || items.Count === 0) {
      throw Error("No data for customer: " + cid);
    }

    const ret = items
      .map((n) => {
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

    return owd.Response(200, ret);
  } catch (error) {
    owd.error(error.message);
    return owd.Response(500, error.message);
  }
};
