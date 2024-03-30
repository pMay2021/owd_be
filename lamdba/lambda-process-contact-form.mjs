/*
 * this is a generic contacts API that can be used to manage contacts (i.e., feedback from customers, messages on contact forms etc.)
 
 * change log
 * ----------
 * v1.0.0 basic 
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";
const devEmail = "m.venugopal@gmail.com";
const fromEmail = "notice@onwhichdate.com";
const logLevel = process.env.LOG_LEVEL;
const goModify = process.env.DB_MODIFY;

const sendEmail = async (fromService, toEmail, templateName = "ContactForm") => {
  let data = {};
  const r = await ch.sendEmail(fromEmail, devEmail, templateName, data);
};

export const handler = async (event, context) => {
  try {
    // Extract the command from the API path
    const method = event.requestContext.http.method;
    const queryParams = event.queryStringParameters;

    owd.log(owd.getVersion(), "\nLib version (note: method = " + method + ")");
    owd.log(db.getVersion(), "\nDB version (note: log level = " + logLevel + ")", logLevel);
    owd.log(ch.getVersion(), "\nChannels version", logLevel);

 
    return owd.Response(200, event.body);

    //now let's act on actions
    if (method === "POST") {
      let body = JSON.parse(event.body);
      let { email, feedback, reason, date, source, name } = body;

      if (!feedback || !reason || !date || !source) {
        return owd.Response(412, { message: "Missing required fields" });
      }

      email = email.trim()?.toLowerCase();
      if (owd.isValidEmail(email) === false) {
        throw new Error("Invalid email format");
      }

      // Extract the variables based on the command
      feedback = feedback.trim().substring(0, 1000);

      const item = {
        pk: { S: email + "-" + source + "-" + owd.getShortId(4) },
        sk: { S: email },
        date: { S: date },
        email: { S: email },
        feedback: { S: feedback },
        reason: { S: reason },
        source: { S: source },
        name: { S: name ?? "-" }
      };

      const im = await db.putItem("db-contact", item);
      owd.log(im, "successfully updated db-customer:", logLevel);
    } //end of register action
    return owd.Response(501);
  } catch (error) {
    return owd.Response(500, error.message);
  }
};
