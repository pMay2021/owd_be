import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"; // ES Modules import
const client = new SQSClient({});

export const handler = async (event) => {
  const n = JSON.parse(event.body);
  if (n.key != "a7Fk4Lz8gR2Bv3cM1QjT9s5Dk8Xn6Hp4UyJ2LrV3PqWz8Nx1E") {
    const response = {
      statusCode: 404,
      body: "unknown request, authorization failed",
    };
    return response;
  }

  //now that we have the request, put it on the queue
  const input = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/627389239307/nudge-q",
    MessageBody: event.body,
  };

  const command = new SendMessageCommand(input);
  const result = await client.send(command);

  const response = {
    statusCode: 200,
    body: JSON.stringify(result),
  };
  return response;
};
