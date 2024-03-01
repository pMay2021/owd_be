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

console.log(`version: ${JSON.stringify(owdMjs.getVersion())}`);
console.log("shortId:" + owdMjs.getShortId());
console.log("daysOfWeek:" + owdMjs.getDayOfWeek("2030-10-08"));
console.log(owdMjs.getOffsetDates("2030-10-08", [0, 60]));
console.log("numDays: " + owdMjs.getNumberOfDaysBetweenDates("2025-06-19", "2023-10-20"));
console.log("friendly: " + owdMjs.getFriendlyDateDifference("2023-06-19", "2025-10-25"));

console.log("dbDocumentSchema: " + JSON.stringify(dbDocumentSchema));
console.log(dbNoticeSchema);

const userPrefs = { cid: "xUmslIspSmdMK", sendEmail: true, sendSMS: false, sendPush: false, sendWhatsApp: false };

const currentDate = new Date().toISOString();
console.log(new Date(currentDate).toLocaleString("en-US", { timeZone: "UTC" }));

//
