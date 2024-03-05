import * as owd from "./owd.mjs";
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

let mm = `pk,sk,Document Name,Description,Reference URL,Processing Time,ReminderOffsetDays,refDoc
travel,us#na#passport,Passport,Official document for international travel requiring periodic renewal.,https://travel.state.gov/content/travel/en/passports.html,6-8 weeks,"[30, 60, 90]",TRUE
travel,us#na#visa,Visa,Authorization for entering and staying in a foreign country for a set period.,https://travel.state.gov/content/travel/en/us-visas.html,Varies by country,"[30, 60, 90]",FALSE
travel,us#na#trustedtraveler,Global Entry TSA & Pre-Check,Validity for the Global entry program,https://www.tsa.gov/precheck,2-3 weeks,"[30, 60]",TRUE
immigration,us#na#greencard,Permanent Resident Card (Green Card),Identification for lawful permanent residents in the U.S. requiring renewal.,https://www.uscis.gov/green-card,10-12 months,"[30, 90, 180]",FALSE
immigration,us#na#ead,Employment Authorization Document,Permit for non-citizens to work in the U.S. requires renewal.,https://www.uscis.gov/ead,4-6 months,"[30, 90, 180]",FALSE
immigration,us#na#i94expiry,I94 Expiry,End date until one can be in the U.S.,https://i94.cbp.dhs.gov/,N/A,"[30, 60, 90]",FALSE
immigration,us#na#visaexpiry,Visa Expiry,Official document of entry,,Varies by visa type,"[30, 60, 90]",FALSE
business,us#na#businessoperationlicense,Business Operation License,Required for legal operation of a business often with annual renewals.,,Varies by state,"[30, 60, 90]",FALSE
business,us#na#professionallincenses,Professional Licenses,Certifications for various professions requiring periodic renewals.,,Varies by license type,"[30, 60, 90]",FALSE
personal_id,us#na#driverlicense,Driver's License,Legal authorization for operating motor vehicles with periodic renewal.,,Varies by state,"[30, 60, 90]",FALSE
personal_id,us#na#stateidcard,State ID Card,State-issued identification requires periodic renewal.,,Varies by state,"[30, 60, 90]",FALSE
vehicle,us#na#vehicleregistration,Vehicle Registration,Annual or biennial requirement for vehicle owners.,,Annual or biennial,"[30, 60]",FALSE
vehicle,us#na#vehicleinsurancepolicy,Vehicle Insurance Policy,Requires periodic renewal to maintain coverage.,,Annually,"[30, 60]",FALSE
vehicle,na#na#maintenancereminder,Maintenance Reminder,Reminder for vehicle maintenance,N/A,As needed,"[30, 60, 90]",FALSE
property,na#na#leaseagreement,Lease Agreement,Rental contracts for property or equipment with fixed terms and renewals.,,Varies by agreement,"[30, 60, 90]",FALSE
property,us#na#homeinsurancepolicy,Home Insurance Policy,Protection for property requiring periodic renewal.,,Annually,"[30, 60, 90]",FALSE
subscriptions,na#na#softwaresubscriptions,Software Subscriptions,Date for renewal of software subscriptions,,Annually,"[30, 60, 90]",FALSE
subscriptions,na#na#domains,Domains,"Renewal dates for domains (e.g., www.disney.com)",,Annually,"[30, 60, 90]",FALSE
subscriptions,na#na#hardwareleases,Hardware Leases,Dates for end of life assets,,Varies by lease term,"[30, 60, 90]",FALSE
intellectual_property,us#na#trademarkregistration,Trademark Registration,Trademarks require renewal to maintain exclusive rights.,https://www.uspto.gov/trademarks,Every 10 years,"[365, 730]",FALSE
intellectual_property,us#na#patent,Patent,Patents have fixed terms and need maintenance fees at regular intervals.,https://www.uspto.gov/patents,Varies by patent type,"[365, 730, 1095]",FALSE
health,na#healthinsurancepolicy,Health Insurance Policy,Contract for health insurance coverage typically renewed annually.,,Annually,"[30, 60, 90]",FALSE
education,na#na#professionalcertifications,Professional Certifications,Credentials for specialized skills often requiring periodic renewal.,,Varies by certification,"[30, 60, 90]",FALSE
education,na#na#collegeapplicationdeadlines,College Application Deadlines,Needed for college admissions.,,Varies by college,"[30, 60, 90]",FALSE` ;

let entries = mm.split('\n').slice(1).map(line => {
    let [pk, sk, documentName, description, referenceURL, processingTime, reminderOffsetDays, refDoc] = line.split(',');
    reminderOffsetDays = reminderOffsetDays ? reminderOffsetDays.split(',').map(Number) : [];
    refDoc = refDoc === 'TRUE';
    return {
        pk,
        sk,
        'Document Name': documentName,
        Description: description,
        'Reference URL': referenceURL,
        'Processing Time': processingTime,
        ReminderOffsetDays: reminderOffsetDays,
        refDoc
    };
});

owd.log(entries, "entries", true);