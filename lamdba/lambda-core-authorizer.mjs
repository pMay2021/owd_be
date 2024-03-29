import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

// This core authorizer is used only where tokens are required
// and sent in the authorization header
// v0.3 - 2024-03-29 - minor fixes and exception for verify command
// v0.2 - 2024-03-28 - minor fixes
// v0.1 - 2024-03-27 - Initial version

const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context) => {
  try {
    let cid, customerRecord;
    const token = event.headers.authorization ?? event.queryStringParameters?.token;
    if (!token) {
      throw new Error("Authorization token is missing");
    }

    const decoded = await db.decodeJWT(token, jwtSecretKey);
    if (decoded.hasError) {
      throw new Error("Authorization error: " + decoded.errMessage);
    }
    cid = decoded.data.data;

    //from this point on, we need a valid customer
    customerRecord = await db.getItem("db-customer", cid);
    if (!customerRecord) {
      throw new Error("Customer not found, something went wrong");
    }

    let email = event.queryStringParameters?.email;
    if (email) {
      email = email.trim()?.toLowerCase();
      if (owd.isValidEmail(email) === false) {
        throw new Error("Invalid email format");
      }

      //at this stage, what's in the record should match sent email
      const crEmail = customerRecord.email.S.trim().toLowerCase();
      if (email !== crEmail) {
        throw new Error(`${crEmail} and ${email} mismatch, unable to verify.`);
      }
    }

    //what if the token sent doesn't match the one in the record?
    if (token && token !== customerRecord.jwt?.S) {
      throw new Error("Token mismatch, please re-login");
    }

    // All commands directed here must have a verified customer to proceed
    let isVerified = customerRecord.isVerified.BOOL;
    
    if (isVerified===false && event.rawPath.includes("/verify")===false) {
      throw new Error("Unauthorized, please verify your account: " + email + " first");
    }

    // we're ready to send the customer record downstream
    const obj = {
      cid: cid,
      email: email,
      customerExists: true,
      isVerified: isVerified,
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
