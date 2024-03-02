import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as owd from "/opt/nodejs/node20/owd.mjs";

const putItemInTable = async (tableName, item) => {
  const client = new DynamoDBClient({ region: "us-east-1" });

  const params = {
    TableName: tableName,
    ReturnConsumedCapacity: "TOTAL",
    Item: item,
  };

  const command = new PutItemCommand(params);
  const response = await client.send(command);

  return response;
};

const getDocument = async (client, pk, sk) => {
  const params = {
    TableName: "db-document",
    Key: { pk: { S: pk }, sk: { S: sk } },
  };

  const command = new GetItemCommand(params);
  const response = await client.send(command);

  return response.Item;
};

const getCustomer = async (cid) => {
  const client = new DynamoDBClient({ region: "us-east-1" });

  const params = {
    TableName: "db-customer",
    Key: { pk: { S: cid } },
  };

  const command = new GetItemCommand(params);
  const response = await client.send(command);

  return response.Item;
};

export const handler = async (event, context) => {
  console.log("Executing lambda-get-reminder on: " + new Date().toISOString() + " owd lib version: " + owd.getVersion().version);
  const { id, loc, expiresOn } = event;
  owd.log(event, `${context.functionName}: received event`);

  const client = new DynamoDBClient({ region: "us-east-1" });
  const cid = "cZ9vKlkdJuKNeMdr4"; // Fixed for testing

  try {
    
    // Validate input parameters
    if (!id || !loc || !expiresOn) {
      throw new Error("Missing required parameters.");
    }

    const customerDb = await getCustomer(cid);
    if (!customerDb) {
      throw new Error("Customer not found.");
    }
    console.log("Retrieved customer details:");

    const docDb = await getDocument(client, id, loc);
    if (!docDb) {
      throw new Error("Document not found.");
    }
    console.log("Retrieved document details:");

    const offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);
    owd.log("Notice dates:", newDates)

    const noticeItem = {
      pk: { S: newDates[1].date + "#" + new Date().getHours() },
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
      notes: { S: "" },
    };

    owd.log("Constructed notice entry:");
    
    const resp = await putItemInTable("db-notice", noticeItem);
    owd.log(resp, "Created notice entry");

    const retJson = { notices: newDates, link: docDb.referenceURL.S };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Record retrieved successfully.",
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
