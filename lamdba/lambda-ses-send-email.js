
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"; // ES Modules import

export const handler = async (event) => {

const client = new SESv2Client({ region: "us-east-1"});
const input = { 
  FromEmailAddress: "notice@onwhichdate.com",
  Destination: { 
    ToAddresses: [
      "m.venugopal@gmail.com",
    ],
  },
  FeedbackForwardingEmailAddress: "bounce@onwhichdate.com",
  Content: { 
    Simple: { 
      Subject: { 
        Data: "A test message from here", // required
      },
      Body: { 
        Text: {
          Data: "well, dis be the body of dis message yo", // required
        },
      },
    },
    /*
    Template: { // Template
      TemplateName: "STRING_VALUE",
      TemplateArn: "STRING_VALUE",
      TemplateData: "STRING_VALUE",
    },
    */
  },
  /*
  EmailTags: [ // MessageTagList
    { // MessageTag
      Name: "STRING_VALUE", // required
      Value: "STRING_VALUE", // required
    },
  ],
  */
};
const command = new SendEmailCommand(input);
const response = await client.send(command);
console.log(response);
};
