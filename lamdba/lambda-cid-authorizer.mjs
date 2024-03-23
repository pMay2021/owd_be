import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";

// This is a Lambda function that is used to authorize the customer ID (cid) and email (optional)
// v0.1 - 2021-09-01 - Initial version

const jwtSecretKey = "/JWT/general-access-token";

export const handler = async (event, context) => {
  const command = event.pathParameters?.proxy;
  const email = event.queryStringParameters?.email?.trim()?.toLowerCase();
  const token = event.queryStringParameters?.token;

  let cid = "none";
  let item;

  // Only the registration command gets a straight pass and it's the first step
  if (command === "register") {
    return { isAuthorized: true, context: { cid: cid, item: {} } };
  }

  // Validate the token for all commands except loginrequest
  if (command !== "loginrequest") {
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

  // If it's a login code request, we need the email but don't care about the token
  if (command === "loginrequest") {
    if (!email) {
      throw new Error("Email is missing");
    }

    item = await db.getCustomerByEmail(email);
    if (!item) {
      throw new Error("Email is invalid/customer not found");
    }
    cid = item.pk.S;
  }

  // If the URL sends an email, then it must match
  const itemEmail = item.email?.S?.trim()?.toLowerCase();

  if (email && email !== itemEmail) {
    throw new Error(`${itemEmail} and ${email} mismatch, unable to verify.`);
  }

  // All commands, except register and verify, must have the customer verified; otherwise, disallow
  if (!item.isVerified) {
    throw new Error("Unauthorized, please verify your account first");
  }

  // Let's map the key items for downstream to use
  const obj = {
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
};
