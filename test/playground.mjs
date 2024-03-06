import * as owd from "../lib/owd.mjs";
// sample for PUT
const body_PUT = {
  nickName: "venappan",
  email: "m.venugopal@gmail.com",
  cid: "HbWUAV7JaA6cio3A",
  cellNumber: "+1732-599 5940",
  country: "us",
  stateCode: "tx",
  sendEmail: "true",
  sendSMS: "false",
  sendWhatsapp: "true",
  sendPush: "false",
};

const reminder_POST = 
{
  version: "2.0",
  routeKey: "POST /reminders",
  rawPath: "/reminders",
  rawQueryString: "",
  headers: {
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br",
    "cache-control": "no-cache",
    "content-length": "429",
    "content-type": "application/json",
    host: "g65d20q980.execute-api.us-east-1.amazonaws.com",
    "postman-token": "9a4e4a91-f976-437d-96d8-f4d39a186272",
    "user-agent": "PostmanRuntime/7.36.3",
    "x-amzn-trace-id": "Root=1-65e54778-1d3b2e8b79047c8d3ee04bb3",
    "x-forwarded-for": "54.86.50.139",
    "x-forwarded-port": "443",
    "x-forwarded-proto": "https",
  },
  requestContext: {
    accountId: "627389239307",
    apiId: "g65d20q980",
    domainName: "g65d20q980.execute-api.us-east-1.amazonaws.com",
    domainPrefix: "g65d20q980",
    http: {
      method: "POST",
      path: "/reminders",
      protocol: "HTTP/1.1",
      sourceIp: "54.86.50.139",
      userAgent: "PostmanRuntime/7.36.3",
    },
    requestId: "UFga8gOkoAMEa3A=",
    routeKey: "POST /reminders",
    stage: "$default",
    time: "04/Mar/2024:04:00:56 +0000",
    timeEpoch: 1709524856990,
  },
  body:{
    "docId": "travel#passport",
    "cid": "XhEUkjDKUjpp6hW",
    "loc": "us#na",
    "expiresOn": "2033-07-01",
    "sendSMS": "true",
    "sendEmail": "true",
    "sendPush": "true",
    "sendWhatsapp": "true",
    "additionalSends": [
        {
            "email": "jose@test.com",
            "cell": "+1222555999",
            "sendEmail": "true",
            "sendSMS": "false"
        }
    ],
    "notes": "for self"
  },
  isBase64Encoded: false,
};

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

owd.log(owd.getVersion(), "version");
owd.log(owd.getOffsetDates("2030-10-08", [0, 60, 240]), "", false);
owd.log(owd.getFriendlyDate("2024-03-30"));

owd.log(owd.getHtmlFromMarkdown("## Hello\n\nThis is a test </div>"), "html");
