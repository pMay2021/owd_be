import * as owdMjs from "./owd.mjs";

const dbDocumentSchema = {
  id: "travel#passport#us",
  state: "na",
  documentName: "Passport",
  importance: "critical",
  category: "Travel Documents",
  description: "Official document for international travel requiring periodic renewal",
  countryFlag: "🇺🇸",
  renewalIntervalYears: [5, 10],
  referenceURL: "https://travel.state.gov/content/travel/en/passports.html",
  processingTime: "4-6 weeks",
  reminderOffsetDays: [0, 30, 60, 180],
  relatedIds: ["travel#visa", "immigration#I-140"],
  notes: "",
};

const dbNoticeSchema = {
  pk: "2029-05-13",
  sk: "cid#xNuBcQk", //use cid and a short id for unique sort key
  cid: "cid", //tp use as a GSI
  isParent: true, //whether this is the original expiry entry
  isAlreadySent: false, //whether this notice has been sent already
  originalExpiryOn: "2029-08-13",
  addedOn: "2024-03-01",
  parentId: "cid#parentid", // to trace the original entry record for this notice
  documentId: "pk.sk", //we want to get the latest about the docs at the time of notice send
  sendSMS: false, //based on the user's preference at the time of creation
  sendEmail: true, //based on the user's preference at the time of creation
  sendPush: false, //based on the user's preference at the time of creation
  sendWhatsApp: false, //based on the user's preference at the time of creation
  notes: "", //added by customer at the time of creation
};

console.log("new Date().getHours(): " + new Date().getHours());

owdMjs.log(owdMjs.getVersion(), "version");
owdMjs.log(owdMjs.getOffsetDates("2030-10-08", [0, 60, 240]), "", false);

const item = {
  pk: { S: cid }, //we're only updating the customer's record
  name: { S: body.name ?? itemDefaults.name.S },
  cellNumber: { S: body.cellNumber ?? itemDefaults.cellNumber.S },
  countryCode: { S: body.country },
  state: { S: body.state ?? itemDefaults.state.S },
  magicCode: { S: owd.getShortId() }, // generate a magic code to use as a link in magic links
  magicCodeExpiresAt: { S: new Date(today.getTime() + 15 * 60000) }, //expires in 15 minutes
  sendEmail: { BOOL: body.sendEmail },
  sendSMS: { BOOL: body.sendSMS },
  sendWhatsapp: { BOOL: body.sendWhatsapp },
  sendPush: { BOOL: body.sendPush },
  additionalEmails: { SS: body.sendAdditionalEmails ?? itemDefaults.additionalEmails.SS }, //for future implementation
};

const bodyItems = {
  "name": "venujaya",
  "cid": "HbWUAV7JaA6cio3A",
  "cellNumber": "+17325995932",
  "country": "us",
  "state": "va",
  "sendEmail": "true",
  "sendSMS": "false",
  "sendWhatsapp": "false",
  "sendPush": "false",
};
