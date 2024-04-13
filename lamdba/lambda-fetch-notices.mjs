/*
 * Fetch notices from onwhichdate.com and place them in a queue
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import { SQS } from "aws-sdk";
const sqs = new SQS();
const logLevel = process.env.LOG_LEVEL;
const goModify = process.env.DB_MODIFY;

export const handler = async (event) => {
  const startTime = performance.now();

  const response = await owd.fetchURL("https:/onwhichdate.com/api/notices", "GET");

  const endTime = performance.now();
  const timeElapsed = endTime - startTime;

  const data = {message: "we came to the processor: " + new Date().toISOString()};
  const body = JSON.stringify(data);

  const sq = await sqs.sendMessage({
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/627389239307/notice-email-q",
    MessageBody: body,
  });

  console.log(`Execution time: ${timeElapsed} milliseconds`);

  return owd.Response(202, { message: r });
};
