// Import necessary AWS SDK clients and commands

import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import * as owd from "/opt/nodejs/node20/owd.mjs";

const getDocument = async (client, pk, sk) => {
  const params = { TableName: "db-document", Key: { pk: { S: pk }, sk: { S: sk } } };

  // Create a command to get the item
  const command = new GetItemCommand(params);

  // Send the command to DynamoDB
  const data = await client.send(command);

  return data.Item;
};

const getCustomer = async (cid) => {
  const client = new DynamoDBClient({ region: "us-east-1" });

  const params = { TableName: "db-customer", Key: { pk: { S: cid } } };

  // Create a command to get the item
  const command = new GetItemCommand(params);

  // Send the command to DynamoDB
  const data = await client.send(command);

  return data.Item;
};

// The Lambda handler function
export const handler = async (event, context) => {
  // Initialize DynamoDB client
  const client = new DynamoDBClient({ region: "us-east-1" });

  const cid = "cZ9vKlkdJuKNeMdr4"; //fixed for testing
  try {
    // Extract id and state from the event object
    const { id, loc, expiresOn } = event;
    console.log(`${context.functionName}: received event: ${JSON.stringify(event)}: id = ${id} and location = ${loc}`);
    const customerDb = await getCustomer(cid);
    console.log("retrieved customer details:");

    console.log(customerDb);
    // get the necessary information, doc and user profile
    const docDb = await getDocument(client, id, loc);
    console.log("retrieved document details:");
    console.log(docDb);

    // compute the notice dates from the expiry and offsets
    let offsetArray = docDb.reminderOffsetDays.L.map((x) => x.N);
    const newDates = owd.getOffsetDates(expiresOn, offsetArray);
    console.log("computed notice dates:");
    console.log(newDates);

    // now construct the notice json

    const noticeItem = {
      pk: newDates[1].date,
      sk: cid + owd.getShortId(6), //use cid and a short id for unique sort key
      addedOn: new Date().toISOString(),
      isParent: true, //whether this is the original expiry entry
      originalExpiryOn: newDates[0].date,
      documentId: docDb.pk.S + "." + docDb.sk.S, //we want to get the latest about the docs at the time of notice send
      sendSMS: event.sendSMS, //based on the user's preference at the time of creation
      sendEmail: event.sendEmail, //based on the user's preference at the time of creation
      sendPush: event.sendPush, //based on the user's preference at the time of creation
      sendWhatsapp: event.sendWhatsapp, //based on the user's preference at the time of creation
      notes: "", //added by customer at the time of creation
    };

    console.log("created notice entry::");
    console.log(noticeItem);

    const retJson = { notices: newDates, link: docDb.referenceURL.S };

    // Return a successful response
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
