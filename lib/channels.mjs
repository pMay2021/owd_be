/*
 * contains channel wrappers for email and text
 * @module lib/channels
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
const goModify = true;

/**
 * returns info on this module
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: "1.0.0",
    date: "2024-03-04",
    details: "A wrapper for channel operations",
    changes: "initial",
  };
};

/** sets a variable that determines in actual db or channel send operations happen. set to false in testing situations.
 */
const setModify = (goModify) => {
  this.goModify = goModify;
};

/**
 * Send an email using SES.
 * @param {string} fromAddress
 * @param {string} toAddress
 * @param {string} templateName
 * @param {object} templateData
 */
const sendEmail = async (fromAddress, toAddress, templateName, templateData) => {
  owd.log(`Sending email to: ${toAddress} from: ${fromAddress} with template: ${templateName}`);

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

  // Send email using SES
  if (goModify) {
    const sesResponse = await ses.send(new SendEmailCommand(input));
  }
};

export { getVersion, sendEmail, setModify};
