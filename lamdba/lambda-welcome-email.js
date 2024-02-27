// The code defines a Lambda function that retrieves customer data from DynamoDB, constructs an email object with the name and a hardcoded address, and sends a welcome email using Amazon SES.

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"; // ES Modules import

export const handler = async (event, context) => {
  const ses = new SESv2Client({ region: "us-east-1" });
  const db = new DynamoDBClient({ region: "us-east-1" });

  // for testing purposes, the target is always the same
  const devEmail = "m.venugopal@gmail.com";

  // get the record from dynamodb
  const cid = event.Records[0].dynamodb.Keys.cid.S;
  const forKey = { Key: { cid: { S: cid } }, TableName: "db-customer" };

  // issue dynamodb commands
  const dbCommand = new GetItemCommand(forKey);
  const response = await db.send(dbCommand);

  //prepare the email
  const data = { email: response.Item.email.S, name: "subscriber" };

  const input = {
    FromEmailAddress: "notice@onwhichdate.com",
    Destination: {
      ToAddresses: [devEmail],
    },
    FeedbackForwardingEmailAddress: "bounce@onwhichdate.com",
    Content: {
      Template: {
        TemplateName: "Welcome",
        TemplateData: JSON.stringify(data),
      },
    },
  };
  const sesCommand = new SendEmailCommand(input);
  const sesResponse = await ses.send(sesCommand);
};
