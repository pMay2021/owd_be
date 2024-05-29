/*
 
 * change log
 * ----------
 * v1.0.1 basic, with proper api mgmt.
 */

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
const ses = new SESv2Client({ region: "us-east-1" });
const devEmail = "m.venugopal@gmail.com";
const fromEmail = "no-reply@eznudge.com";

const log = console.log;

/**
 * Send an email using SES.
 * @param {string} fromAddress
 * @param {string} toAddress
 * @param {string} templateName
 * @param {object} templateData
 * @param {boolean} printLogs - Whether to print logs to the console.
 */
const sendEmail = async (fromAddress, toAddress, cc, subject, content) => {
  log(`Sending email to: ${toAddress} from: ${fromAddress}`);

  const input = {
    FromEmailAddress: fromAddress,
    Destination: {
      ToAddresses: [toAddress],
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: content,
            Charset: "UTF-8",
          },
        },
      },
    },
  };

  const sesResponse = await ses.send(new SendEmailCommand(input));
  return sesResponse;
};

function Response(code, title = "response", message = "none") {
  const body = {
    title: title,
    type: "/support/codes/" + code,
    status: code,
    message: message || "",
  };

  return {
    statusCode: code,
    headers: { "Content-Type": "application/problem+json" },
    body: JSON.stringify(body),
  };
}

export const handler = async (event, context) => {
  console.log("received event: ", event);

  try {
    const body = JSON.parse(event.Records[0].body);
    log("received body: ", body);

    if (!body) {
      console.log("no body to parse");
      throw new Error("Invalid/missing body");
    }

    const email = body.to.trim()?.toLowerCase();
    log("ready to send to " + email + "with content " + body.content);
    const r = await sendEmail(
      "no-reply@eznudge.com",
      devEmail,
      "",
      body.subject,
      body.content
    );
    console.log(r);
    return Response(202, "Email sent.", "email sent");
  } catch (error) {
    log("hit an error:  " + error.message);
    return Response(500, "email send error", error.message);
  }
};
