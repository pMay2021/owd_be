import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

export const handler = async (event, context) => {
  const ses = new SESv2Client({ region: "us-east-1" });
  const db = new DynamoDBClient({ region: "us-east-1" });
  
  // for testing purposes, the target is always the same
  const devEmail = "m.venugopal@gmail.com";

  // Extract customer ID and validate its presence
  const cid = event.Records[0]?.dynamodb?.Keys?.cid?.S;
  if (!cid) {
    console.error("Missing customer ID in event data");
    return { statusCode: 500, body: "Customer ID not found" };
  }

  try {
    // Retrieve customer data from DynamoDB
    const forKey = { Key: { cid: { S: cid } }, TableName: "db-customer" };
    const dbResponse = await db.send(new GetItemCommand(forKey));

    // Check for successful retrieval
    if (!dbResponse.Item) {
      console.error("Customer data not found in DynamoDB");
      return { statusCode: 404, body: "Customer not found" };
    }

    // Prepare email data
    const email = dbResponse.Item.email.S;
    const name = "subscriber"; // Replace with actual name if available
    const data = { email, name };

    const input = {
      FromEmailAddress: "notice@onwhichdate.com",
      Destination: {
        ToAddresses: [devEmail], // Use actual email address in production
      },
      FeedbackForwardingEmailAddress: "bounce@onwhichdate.com",
      Content: {
        Template: {
          TemplateName: "Welcome",
          TemplateData: JSON.stringify(data),
        },
      },
    };

    // Send email using SES
    const sesResponse = await ses.send(new SendEmailCommand(input));

    // Log success or handle errors
    if (sesResponse.MessageId) {
      console.log("Email sent successfully");
      return { statusCode: 200, body: "Email sent" };
    } else {
      console.error("Failed to send email:", sesResponse.Error);
      return { statusCode: 500, body: "Email sending failed" };
    }
  } catch (error) {
    console.error("Error in lambda function:", error);
    return { statusCode: 500, body: "Internal server error" };
  }
};
