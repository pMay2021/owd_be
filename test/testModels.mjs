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
const months = [
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
];
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
  expiresOn:
    owd.pickRandomValue(years) +
    "-" +
    owd.pickRandomValue(months) +
    "-" +
    owd.pickRandomValue(days),
  sendSMS: owd.pickRandomValue(["true", "false"]),
  sendEmail: "true",
  sendPush: owd.pickRandomValue(["true", "false"]),
  sendWhatsapp: owd.pickRandomValue(["true", "false"]),
  alsoCC: owd.pickRandomValue(["true", "false"]),
  notes: "for self",
};

owd.log(updateCustomer, "Update Customer");
owd.log(newReminderPOST, "New Expiry POST");


let n = {
  "version": "2.0",
  "routeKey": "POST /api/nudge",
  "rawPath": "/v1/api/nudge",
  "rawQueryString": "",
  "headers": {
    "accept-encoding": "gzip, deflate",
    "content-length": "154",
    "content-type": "application/json",
    "host": "jrmxpz3t39.execute-api.us-east-1.amazonaws.com",
    "user-agent": "vscode-restclient",
    "x-amzn-trace-id": "Root=1-665627d2-132329931e3fa8f42083bb41",
    "x-forwarded-for": "174.61.230.74",
    "x-forwarded-port": "443",
    "x-forwarded-proto": "https"
  },
  "requestContext": {
    "accountId": "627389239307",
    "apiId": "jrmxpz3t39",
    "domainName": "jrmxpz3t39.execute-api.us-east-1.amazonaws.com",
    "domainPrefix": "jrmxpz3t39",
    "http": {
      "method": "POST",
      "path": "/v1/api/nudge",
      "protocol": "HTTP/1.1",
      "sourceIp": "174.61.230.74",
      "userAgent": "vscode-restclient"
    },
    "requestId": "Yfso7jV9oAMEM4A=",
    "routeKey": "POST /api/nudge",
    "stage": "v1",
    "time": "28/May/2024:18:52:02 +0000",
    "timeEpoch": 1716922322462
  },
  "body": "{\n    \"to\": \"m.venugopal@gmail.com\",\n    \"from\": \"no-reply@eznudge.com\",\n    \"cc\": [\"a@e.com\", \"b@e.com\"],\n    \"content\": \"Hello, this is a test email\",\n}",
  "isBase64Encoded": false
}