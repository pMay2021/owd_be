import * as owd from "../lib/owd.mjs";

// JSON models for the workflows
const randomPrimaryEmail = owd.getShortId(8) + "@test.com";
const randomSecondaryEmail = owd.getShortId(8) + "@test.com";
const randomCellNumber = "+1" + owd.getShortId(10, "1234567890");
const updateCustomer = {
  nickName: owd.getShortId(5, "teioasn"),
  cid: "oY0SYz1T3ZwkInz", //standard test ID, an update is sent via encrypted channel
  emailCC: [randomSecondaryEmail], //allow for future expansion with more emails
  ccOnByDefault: "false",
  cellNumber: randomCellNumber,
  countryCode: "us",
  stateCode: "wa",
  sendEmail: "true",
  sendSMS: "true",
  sendWhatsapp: "false",
  sendPush: "false",
  sendMarketingEmails: "false",
  sendTopicUpdates: "true",
};

const years = [2026, 2027, 2028, 2029, 2030];
const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const days = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
];

const cids = ["houuyhePCJ11lpK", "oY0SYz1T3ZwkInz", "iqI0tuWpTXRbPWM"];

const newReminderPOST = {
  docId: "travel|us#i94",
  cid: "oY0SYz1T3ZwkInz", //standard test ID
  expiresOn: owd.pickRandomValue(years) + "-" + owd.pickRandomValue(months) + "-" + owd.pickRandomValue(days),
  sendSMS: owd.pickRandomValue(["true", "false"]),
  sendEmail: "true",
  sendPush: owd.pickRandomValue(["true", "false"]),
  sendWhatsapp: owd.pickRandomValue(["true", "false"]),
  alsoCC: owd.pickRandomValue(["true", "false"]),
  notes: "for self",
};


owd.log(updateCustomer, "Update Customer");
owd.log(newReminderPOST, "New Expiry POST");
