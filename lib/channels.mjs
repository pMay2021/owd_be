/*
 * contains channel wrappers for email and text
 * @module lib/channels
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
const ses = new SESv2Client({ region: "us-east-1" });

/**
 * returns info on this module
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: "1.0.2",
    date: "2024-03-13",
    details: "A wrapper for channel operations",
    changes: "minor cleanup",
  };
};

/**
 * Send an email using SES.
 * @param {string} fromAddress
 * @param {string} toAddress
 * @param {string} templateName
 * @param {object} templateData
 * @param {boolean} printLogs - Whether to print logs to the console.
 */
const sendEmail = async (fromAddress, toAddress, templateName, templateData, printLogs = false) => {
  if (printLogs) owd.log(`Sending email to: ${toAddress} from: ${fromAddress} with template: ${templateName}`);

  const input = {
    FromEmailAddress: fromAddress,
    Destination: {
      ToAddresses: [toAddress],
    },
    FeedbackForwardingEmailAddress: fromAddress,
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify(templateData),
      },
    },
  };

  if (printLogs) owd.log(input, "sendEmail: input");
  const sesResponse = await ses.send(new SendEmailCommand(input));
  return sesResponse;
};

export { getVersion, sendEmail };
