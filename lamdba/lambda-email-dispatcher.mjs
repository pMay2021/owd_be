/**
 * This code picks a notice from the queue and dispatches it to email as required.
 * The notice could be reminder notice, or other types as dictacted by the notice type
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
  return r;
};

export const handler = async (event) => {
  console.log("received queue call", event.Records[0].body);

  const item = JSON.parse(event.Records[0].body);
  const data = {
    name: item.customerName,
    documentName: item.name,
    dueInDays: item.dueInDays,
    dueDate: item.expiresOn,
    category: item.category,
    notes: item.notes,
    editMagicLink: "https://onwhichdate.com/" + item.secretURL,
    referenceNotes: "TBC",
  };

  const r = await sendTemplatedEmail(devEmail, data, "owd-reminder-notice");
  owd.log(r, "email response");
  return owd.Response(202, { message: r });
};
