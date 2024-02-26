import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"; // ES Modules import

export const handler = async (event, context) => {
  const client = new SESv2Client({ region: "us-east-1" });
  const logStr = `${context.functionName} : ${JSON.stringify(event)}`
  console.log(logStr);

  //let's get the input values
  const email =  "m.venugopal@gmail.com";
  
  const cid = event.Records[0].dynamodb.Keys.cid.S;
  const name = cid +" # " + event.name || email;

  const data = {
    email: email,
    name: name,
  };

  const input = {
    FromEmailAddress: "notice@onwhichdate.com",
    Destination: {
      ToAddresses: ["m.venugopal@gmail.com"],
    },
    FeedbackForwardingEmailAddress: "bounce@onwhichdate.com",
    Content: {
      Template: {
        TemplateName: "Welcome",
        TemplateData: JSON.stringify(data),
      },
    },
  };
  const command = new SendEmailCommand(input);
  const response = await client.send(command);
};
