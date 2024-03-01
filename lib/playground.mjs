import * as owdMjs from "./owd.mjs";

const dbDocumentSchema = {
  id: { S: "travel#passport#us" },
  state: { S: "na" },
  documentName: { S: "Passport" },
  importance: { S: "critical" },
  category: { S: "Travel Documents" },
  description: { S: "Official document for international travel requiring periodic renewal" },
  countryFlag: { S: "🇺🇸" },
  renewalIntervalYears: { L: [{ N: "5" }, { N: "10" }] },
  referenceURL: { S: "https://travel.state.gov/content/travel/en/passports.html" },
  processingTime: { S: "4-6 weeks" },
  reminderOffsetDays: { L: [{ N: "0" }, { N: "30" }, { N: "60" }, { N: "180" }] },
  relatedIds: { L: [{ S: "travel#visa" }, { S: "immigration#I-140" }] },
  notes: { S: "" },
};

const dbNoticeSchema = {
  "pk": "2029-05-13",
  "sk": "cid#xNuBcQk", //use cid and a short id for unique sort key
  "isParent": true, //whether this is the original expiry entry
  "originalExpiryOn": "2029-08-13",
  "parentId": "cid#parentid", // to trace the original entry record for this notice
  "documentId": "pk.sk", //we want to get the latest about the docs at the time of notice send
  "sendSMS": false, //based on the user's preference at the time of creation
  "sendEmail": true, //based on the user's preference at the time of creation
  "sendPush": false, //based on the user's preference at the time of creation
  "sendWhatsApp": false, //based on the user's preference at the time of creation
  "notes": "" //added by customer at the time of creation
}

console.log(`version: ${JSON.stringify(owdMjs.getVersion())}`);
console.log("shortId:" + owdMjs.getShortId());
console.log("daysOfWeek:"+ owdMjs.getDayOfWeek("2030-10-08"));
console.log(owdMjs.getOffsetDates("2030-10-08", [0, 60]));
console.log("numDays: " + owdMjs.getNumberOfDaysBetweenDates("2025-06-19", "2023-10-20"));
console.log("friendly: " + owdMjs.getFriendlyDateDifference("2023-06-19", "2025-10-25"));

console.log("dbDocumentSchema: " + JSON.stringify(dbDocumentSchema));
console.log(dbNoticeSchema);

function generateNoticeEntry(document, userPrefs) {
  let input = {
    expiryDate: "2029-08-13",
    documentId: "travel#passport#us",
    sendEmail: true,
    sendSMS: false,
    sendPush: false,
    sendWhatsApp: false,
    notes: "Renewal reminder for passport"
  };
}