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
  const data = {
    documentName: "passport",
    name: "dummy",
    date: "2024-10-12",
    notes: "new notes 2:" + event.Records[0].body,
    entries: "some entries",
  };

  const r = await sendTemplatedEmail(devEmail, data, "owd-reminder-record");
  owd.log(r, "email response");
  return owd.Response(202, { message: r });
};
