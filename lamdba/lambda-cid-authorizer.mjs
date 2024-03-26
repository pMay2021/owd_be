import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

// This is a Lambda function that is used to authorize the customer ID (cid) and email (optional)
// v0.3 - heavy revision to support new customer API
// v0.21 - revision of customer API updates
// v0.1 - 2021-09-01 - Initial version

const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context, callback) => {
  try {
    let cid, customerRecord;
    const method = event.requestContext.http.method;
    const qsp = event.queryStringParameters;

    const allowedGetCommands = ["issue", "register", "verify", "login", "logout"];

    //email is mandatory for all requests to customer API's
    let email = event.queryStringParameters?.email;

    if (!email) {
      throw new Error("Email is missing");
    }

    email = email.trim()?.toLowerCase();

    if (owd.isValidEmail(email) === false) {
      throw new Error("Invalid email format");
    }

    // email is source for identification for POST (registration) or GET (issue)
    // no token is expected for these two commands
    // everything else going forward needs a token
    if (method === "POST") {
      return resp({ email: email, isVerified: true, cid: " " });
    }

    if (method === "GET" && qsp.action === "issue") {
      customerRecord = await db.getCustomerByEmail(email);
      if (!customerRecord || customerRecord.isVerified.BOOL === false) {
        throw new Error("Customer does not exist or is unverified.");
      } else return resp({ email: email, isVerified: true, cid: customerRecord.pk.S });
    }

    //if a token is attached, it must be valid
    const token = event.queryStringParameters?.token;
    if (token) {
      const decoded = await db.decodeJWT(token, jwtSecretKey);
      if (decoded.hasError) {
        throw new Error("Authorization error: " + decoded.errMessage);
      }
      cid = decoded.data.data;
    }

    //from this point on, we need a valid customer
    customerRecord = await db.getItem("db-customer", cid);
    if (!customerRecord) {
      throw new Error("Customer not found, something went wrong");
    }

    //at this stage, what's in the record should match sent email
    const crEmail = customerRecord.email?.S?.trim()?.toLowerCase();
    if (email !== crEmail) {
      throw new Error(`${crEmail} and ${email} mismatch, unable to verify.`);
    }

    //what if the token sent doesn't match the one in the record?
    if (token && token !== customerRecord.jwt?.S) {
      throw new Error("Token mismatch, please re-login");
    }

    // All commands, except register and verify, must have the customer verified; otherwise, disallow
    if (["verify", "register"].includes(qsp.command) && !customerRecord.isVerified?.BOOL) {
      throw new Error("Unauthorized, please verify your account first");
    }

    // we're ready to send the customer record downstream
    const obj = {
      cid: cid,
      email: email,
      customerExists: true,
      isVerified: customerRecord.isVerified?.BOOL ?? false,
      subscriptionEndDate: customerRecord.subscriptionEndDate?.S,
      subscriptionStatus: customerRecord.subscriptionStatus?.S,
      subscriptionType: customerRecord.subscriptionType?.S,
    };

    return resp(obj);
  } catch (error) {
    return resp(error.message, false);
  }
};

const resp = (obj, isAuthorized = true) => {
  return {
    isAuthorized: true,
    context: { isAuthorized: isAuthorized, details: obj },
  };
};
