/*
 * Fetch notices from server and place them in a queue
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"; // ES Modules import

const client = new SQSClient({});
import { performance } from "perf_hooks";

const logLevel = process.env.LOG_LEVEL;
const goModify = process.env.DB_MODIFY;

export const handler = async (event) => {
  const startTime = performance.now();

  const notices = await owd.fetchURL("https:/onwhichdate.com/api/notices?n=3", "GET");
  console.log("notices", notices);
  if (notices.ok != true) {
    owd.log(notices, "lambda-fetch-notice failed/or there's nothing to send");
    return owd.Response(400, notices);
  }

  //let item = notices.message.data[1];
  let items = notices.message.data;
  if (!items || items.length === 0) {
    owd.log(notices, "lambda-fetch-notice: there's nothing to send");
    return owd.Response(204, notices);
  }

  for (let item of items) {
    const body = JSON.stringify(item);

    const input = {
      QueueUrl: "https://sqs.us-east-1.amazonaws.com/627389239307/notice-email-q",
      MessageBody: body,
    };

    const command = new SendMessageCommand(input);
    const response = await client.send(command);
  }

  const endTime = performance.now();
  const timeElapsed = endTime - startTime;

  console.log(`Execution time: ${timeElapsed} milliseconds`);

  return owd.Response(202, { message: "success: " + timeElapsed});
};
