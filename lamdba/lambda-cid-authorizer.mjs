// This lambda is used to authorize the customer id (cid) and return the customer object
// v1.0.0 - basic

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";
const today = new Date();
const logLevel = process.env.LOG;
const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context) => {
  const command = event.pathParameters?.proxy;

  //for all incoming requests let's have dummies so downstream don't crash by mistake
  let cid = "none";

  let obj = {
    cid: "none",
    email: event.queryStringParameters?.email,
    isVerified: false,
    customerExists: false,
  };

  if (command === "register") {
    let response = {
      isAuthorized: true,
      context: {
        cid: cid,
        item: obj,
      },
    };
    return response;
  }

  const token = event.queryStringParameters.token;
  const decoded = await db.decodeJWT(token, jwtSecretKey);
  owd.log(decoded, "decoded");

  if (decoded.hasError) {
    owd.error("authorization error: " + decoded.errMessage);
    return { isAuthorized: false, context: { message: "token decode failed" } };
  }

  cid = decoded.data.data;

  //extract the customer
  const item = await db.getItem("db-customer", cid);
  if (!item) return { isAuthorized: false, context: { message: "customer not found, something went wrong" } };

  //if the URL sends an email, then it must match
  if (event.queryStringParameters?.email) {
    const email = item.email.S.trim().toLowerCase();
    const queryEmail = event.queryStringParameters?.email?.trim().toLowerCase();

    if (queryEmail != email) {
      const fResp = `${email} and ${queryEmail} mismatch, unable to verify.`;
      return { isAuthorized: false, context: { message: fResp } };
    }
  }

  //let's map the key items for downstream to use
  obj = {
    cid: cid,
    email: item.email.S,
    customerExists: true,
    isVerified: item.isVerified.BOOL,
    subscriptionEndDate: item.subscriptionEndDate.S,
    subscriptionStatus: item.subscriptionStatus.S,
    subscriptionType: item.subscriptionType.S,
  };

  let response = { isAuthorized: true, 
    context: { cid: cid, item: obj } };

  return response;
};
