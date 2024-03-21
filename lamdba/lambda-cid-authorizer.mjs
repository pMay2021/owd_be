// This is a Lambda function that is used to authorize the customer ID (cid) and email (optional)

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context) => {
  const cid = "none";
  try {
    const command = event.pathParameters?.proxy;

    let obj = {
      cid: cid,
      email: event.queryStringParameters?.email,
      isVerified: false,
      customerExists: false,
    };

    if (command === "register") {
      return { isAuthorized: true,
        context: { cid: cid, item: obj },
      };
    }

    const token = event.queryStringParameters?.token;
    if (!token) {
      throw new Error("Token is missing");
    }

    const decoded = await db.decodeJWT(token, jwtSecretKey);
    owd.log(decoded, "decoded");

    if (decoded.hasError) {
      throw new Error("Authorization error: " + decoded.errMessage);
    }

    cid = decoded.data.data;

    // Extract the customer
    const item = await db.getItem("db-customer", cid);
    if (!item) {
      throw new Error("Customer not found, something went wrong");
    }

    // If the URL sends an email, then it must match
    const email = item.email?.S?.trim()?.toLowerCase();
    const queryEmail = event.queryStringParameters?.email?.trim()?.toLowerCase();

    if (queryEmail && queryEmail !== email) {
      const fResp = `${email} and ${queryEmail} mismatch, unable to verify.`;
      throw new Error(fResp);
    }

    // Let's map the key items for downstream to use
    obj = {
      cid: cid,
      email: item.email?.S,
      customerExists: true,
      isVerified: item.isVerified?.BOOL,
      subscriptionEndDate: item.subscriptionEndDate?.S,
      subscriptionStatus: item.subscriptionStatus?.S,
      subscriptionType: item.subscriptionType?.S,
    };

    return {
      isAuthorized: true,
      context: { cid: cid, item: obj },
    };
  } catch (error) {
    return {
      isAuthorized: false,
      context: {
        message: error.message,
      },
    };
  }
};
