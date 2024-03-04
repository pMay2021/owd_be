import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as owd from "/opt/nodejs/node20/owd.mjs";

export const handler = async (event, context) => {
  console.log("Executing lambda-get-reminder on: " + new Date().toISOString() + " owd lib version: " + owd.getVersion().version);
  const { id, loc, expiresOn } = event;
  owd.log(event, `${context.functionName}: received event`);

  const cid = "cZ9vKlkdJuKNeMdr4"; // Fixed for testing

  try {
    
    // Validate input parameters
    if (!id || !loc || !expiresOn) {
      throw new Error("Missing required parameters.");
    }

    const customerDb = await owd.getItem("db-customer", cid);
    
    if (!customerDb) {
      throw new Error("Customer not found.");
    }
    owd.log(customerDb, "\nRetrieved customer details:");

    const docDb = await owd.getItem("db-document", id, loc);
    if (!docDb) {
      throw new Error("Document not found.");
    }
    owd.log(docDb, "\nRetrieved document details:");

    const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);
    
    for (const date of newDates) {
      const hour = new Date().getHours().toString().padStart(2, '0');
      const noticeItem = {
        pk: { S: date.date + "#" + hour},
        sk: { S: cid + "#" + owd.getShortId(6) },
        cid: { S: cid },
        isAlreadySent: { BOOL: false },
        addedOn: { S: new Date().toISOString() },
        isParent: { BOOL: true },
        originalExpiryOn: { S: newDates[0].date },
        documentId: { S: docDb.pk.S + "|" + docDb.sk.S },
        sendSMS: { BOOL: event.sendSMS },
        sendEmail: { BOOL: event.sendEmail },
        sendPush: { BOOL: event.sendPush },
        sendWhatsapp: { BOOL: event.sendWhatsapp },
        additionalSends: { S: JSON.stringify(event.additionalSends) },
        notes: { S: event.notes },
      };

      owd.log(noticeItem, "\nConstructed notice entry for:", false);

      const resp = await owd.putItem("db-notice", noticeItem);
    }

    const retJson = { notices: newDates, link: docDb.referenceURL.S };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Added reminders successfully!",
        data: retJson,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error(error);

    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to retrieve item" }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
