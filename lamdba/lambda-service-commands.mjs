/*
 * this code does both POST (clicked on magic link so we add new subscriber)
 * and PUT (updating a record)
 
 * change log
 * ----------
 * v1.0.1 basic, with proper api mgmt.
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
import * as ch from "/opt/nodejs/node20/channels.mjs";
const devEmail = "m.venugopal@gmail.com";
const fromEmail = "notice@onwhichdate.com";
const logLevel = process.env.LOG_LEVEL;
const goModify = process.env.DB_MODIFY;

const sendTemplatedEmail = async (to, data, templateName) => {
  const r = await ch.sendEmail(fromEmail, devEmail, templateName, data);
};

export const handler = async (event, context) => {
  try {
    // Extract the command from the API path
    const method = event.requestContext.http.method;
    const queryParams = event.queryStringParameters;
    const command = event.pathParameters.command;

    owd.log(owd.getVersion(), "\nLib version (note: method = " + method + ")");
    owd.log(db.getVersion(), "\nDB version (note: log level = " + logLevel + ")", logLevel);
    owd.log(ch.getVersion(), "\nChannels version", logLevel);

    if (method === "POST") {
      const body = JSON.parse(event.body);
      if (!body) {
        throw new Error("Invalid/missing body");
      }

      if (command === "templated-email") {
        const email = body.to.trim()?.toLowerCase();
        if (owd.isValidEmail(email) === false) {
          throw new Error("Invalid email format");
        }

        const r = await sendTemplatedEmail(body.to, body.data, body.templateName);
        return owd.Response(202, { message: "Sent." });
      }

      if (command === "add-notice") {
        return owd.Response(200, { message: "add-notices" });
      }

      return owd.Response(200);
    }
  } catch (error) {
    return owd.Response(500, error.message);
  }
};
