// This is a Lambda function that is used to authorize the customer ID (cid) and email (optional)
// v0.1 - 2021-09-01 - Initial version

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context) => {
  let cid = "none";
  try {
    const command = event.pathParameters?.proxy;

    let obj = {
      cid: cid,
      email: event.queryStringParameters?.email,
      isVerified: false,
      customerExists: false,
    };

    
    //only the registration command gets a straight pass and it's the first step
    if (command === "register") {
      return { isAuthorized: true,
        context: { cid: cid, item: obj },
      };
    }
    
    let item;
    
    // if it's a login code request, we need the email but don't care about the token
    if( command === "loginrequest") {
      item = await db.getCustomerByEmail(obj.email);
      if (!item) {
        throw new Error("Email is invalid/customer not found");
      }
      cid = item.pk.S;
    } else {
      //all other commands must have a token
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
      item = await db.getItem("db-customer", cid);
      if (!item) {
        throw new Error("Customer not found, something went wrong");
      }
    }

    // If the URL sends an email, then it must match
    const email = item.email?.S?.trim()?.toLowerCase();
    const queryEmail = event.queryStringParameters?.email?.trim()?.toLowerCase();

    if (queryEmail && queryEmail !== email) {
      const fResp = `${email} and ${queryEmail} mismatch, unable to verify.`;
      throw new Error(fResp);
    }
    
    //all commands, except register and verify, must have the customer verified; otherwise, disallow
    if (!item.isVerified) {
        throw new Error("unauthorized, please verify your account first");
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
