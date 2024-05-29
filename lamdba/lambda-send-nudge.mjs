/*
 
 * change log
 * ----------
 * v0.1 this code works for sending simple and raw email with attachment
 */

import {
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";
//import nodemailer from "nodemailer";

const ses = new SESv2Client({ region: "us-east-1" });
const devEmail = "m.venugopal@gmail.com";
const fromEmail = "no-reply@eznudge.com";

const log = console.log;

/**
 * Send an email using SES.
 * @param {string} fromAddress
 * @param {string} toAddress
 * @param {array} list of cc addresses
 * @param {string} subject of the email
 */
const sendEmail = async (fromAddress, toAddress, cc, subject, content) => {
  log(`Sending email to: ${toAddress} from: ${fromAddress}`);

  const input = {
    FromEmailAddress: fromAddress,
    Destination: {
      ToAddresses: [toAddress],
      CcAddresses: cc?.length > 0 ? cc : [],
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

const sendRawEmail = async (sendParams) => {
  log(`Sending raw email:\n ${JSON.stringify(sendParams)}`);

  const boundary = "----=_NextPart_001_0000";

  const rawEmail = `
From: ${sendParams.from}
To: ${sendParams.to}
Subject: ${sendParams.subject}
Cc: ${sendParams.cc?.length > 0 ? sendParams.cc.join(", ") : ""},
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset=UTF-8

Let us send a dummy content

--${boundary}
Content-Type: text/calendar; name="eznudge.ics"
Content-Description: eznudge.ics
Content-Disposition: attachment; filename="eznudge.ics"
Content-Transfer-Encoding: base64

${sendParams.attachmentContentBase64}

--${boundary}--
`;

//let data = Buffer.from(rawEmail.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"), 'utf8');
let data = Buffer.from(rawEmail.trim(), 'utf8');

  const params = {
    FromEmailAddress: sendParams.from,
    Destination: {
      ToAddresses: [sendParams.to],
      CcAddresses: sendParams.cc?.length > 0 ? sendParams.cc : [],
    },
    Content: {
       Raw: {
        Data: data
      },
    },
  };
  

  try {
    const sesResponse = await ses.send(new SendEmailCommand(params));
    console.log("Email sent successfully:", sesResponse);
    return Response(200, "Email sent successfully", "Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    return Response(500, "Error sending email", error.message);
  }
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
  try {
    const body = JSON.parse(event.Records[0].body);
    log("received body: ", body);

    if (!body) {
      console.log("no body to parse");
      throw new Error("Invalid/missing body");
    }

    const email = body.to.trim()?.toLowerCase();
    const r = await sendRawEmail(body);
    // const r = await sendEmail(
    //   "no-reply@eznudge.com",
    //   devEmail,
    //   body.cc,
    //   body.subject,
    //   body.content
    // );
    console.log(r);
    return Response(202, "Email sent.", "email sent");
  } catch (error) {
    log("hit an error:  " + error.message);
    return Response(500, "email send error", error.message);
  }
};
