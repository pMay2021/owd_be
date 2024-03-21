import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  PutItemCommand,
  QueryCommand,
  DeleteItemCommand,
  ExecuteStatementCommand,
} from "@aws-sdk/client-dynamodb";
import * as owd from "/opt/nodejs/node20/owd.mjs";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const region = "us-east-1";
const client = new DynamoDBClient({ region: region });
const ssmClient = new SSMClient({ region: region });
const s3 = new S3Client({ region: region });

/**
 * Returns information about this module.
 *
 * @returns {object} A JSON object with the module's version and additional details.
 */
const getVersion = () => {
  return {
    version: "1.5.2",
    date: "2024-03-20",
    details: "DB wrapper lib for DynamoDB with reusable functions",
    changes: "getNoticesByParentId, now with JWT functions and better error handling results",
  };
};

/**
 * Retrieves the value of a parameter from the AWS Systems Manager Parameter Store.
 *
 * @param {string} parameterName - The name of the parameter to retrieve.
 * @param {boolean} [withDecryption=true] - Indicates whether to decrypt the parameter value. Defaults to true.
 * @returns {Promise<string>} - A promise that resolves to the value of the parameter.
 */
const getParameter = async (parameterName, withDecryption = true) => {
  const command = new GetParameterCommand({ Name: parameterName, WithDecryption: withDecryption });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
};

const encodeJWT = async (customerId, secretParam, expiresIn = "1h") => {
  const secret = await getParameter(secretParam);
  if (!secret) {
    throw new Error("JWT secret not found");
  }
  const options = { expiresIn: expiresIn };
  return jwt.sign({ data: customerId }, secret, options);
};

const decodeJWT = async (token, secretParam) => {
  let ret = {};
  try {
    const secret = await getParameter(secretParam);
    ret.data = jwt.verify(token, secret);
    return { data: ret.data, hasError: false, errName: null, errMessage: null };
  } catch (error) {
    //boilerplate error handling
    ret.errName = error.name;
    ret.errMessage = error.message;
    return { data: null, hasError: true, errName: error.name, errMessage: error.message };
    switch (error.name) {
      case "TokenExpiredError":
        ret.error = "Token has expired";
        break;
      case "JsonWebTokenError":
        ret.error = "Invalid token";
        break;
      default:
        owd.error(error.message);
    }
    owd.error(error.message);
    return null;
  }
};

/**
 * Retrieves an object from an S3 bucket.
 *
 * @param {string} bucketName - The name of the S3 bucket.
 * @param {string} filePath - The path of the file in the bucket.
 * @returns {string} - the string content
 */
const getS3Text = async (bucketName, filePath) => {
  const input = {
    Bucket: bucketName,
    Key: filePath,
  };

  const command = new GetObjectCommand(input);
  const response = await s3.send(command);
  const data = await response.Body.transformToString();

  return data;
};

/**
 * Puts an item into a DynamoDB table.
 *
 * @param {string} tableName - The name of the table.
 * @param {object} item - The JSON item to be put into the table.
 * @returns {Promise<object>} - A promise that resolves to the response from DynamoDB.
 */
const putItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    ReturnConsumedCapacity: "TOTAL",
    Item: item,
  };

  owd.debug({ fn: "Entering putItem", params: params }, "function: putItem:");

  const command = new PutItemCommand(params);
  const response = await client.send(command);

  return response;
};

/**
 * Gets an item from a DynamoDB table. Only meant for tables with pk and/or sk and not for GSI. Only meant to return a single item.
 *
 * @param {string} tableName - The name of the table.
 * @param {string} pk - The partition key.
 * @param {string} sk - The sort key.
 * @returns {Promise<object>} - A promise that resolves to the item from the table.
 */
const getItem = async (tableName, pk, sk = null) => {
  const key = sk ? { pk: { S: pk }, sk: { S: sk } } : { pk: { S: pk } };
  const params = {
    TableName: tableName,
    Key: key,
  };
  owd.debug({ fn: "Entering getItem", params: params }, "function: getItem:");

  const command = new GetItemCommand(params);
  const response = await client.send(command);

  return response.Item;
};

/**
 * helper function to get customer by email; only works when email is the
 * GSI index and the attribute name is "email"
 * @param {*} email
 * @param {*} tableName (default is db-customer)
 * @returns  null or the customer object
 */
const getCustomerByEmail = async (email, tableName = "db-customer") => {
  const items = await queryItems(tableName, "email-index", "email = :email", { ":email": { S: email } });
  return items[0];
};

/**
 * Queries a DynamoDB table. Use for PK and full or partial SK.
 * Returns 0 or more items. Use Item Count to check if any items were returned. An example of the function call:
 * const items = await db.queryItems("db-notice", "cid-index", "cid = :cid", { ":cid": { S: "123" }});
 *  const items = await db.queryItems("db-notice", "sk-index", "pk = :pk and begins_with(sk, :sk)", { ":pk": { S: "123" }, ":sk": { S: "2024-03-13" } });
 *
 * @param {string} tableName - The name of the table.
 * @param {string} indexName - The GSI index. (optional), send null or "" if not using GSI.
 * @param {string} keyConditionExpression - The condition expression. E.g., "email = :email".
 * @param {object} expressionAttributeValues - The expression attribute values. E.g., { ":email": { S: email } }.
 * @returns {Promise<object[]>} - A promise that resolves to an array of items from the table.
 */
const queryItems = async (tableName, indexName, keyConditionExpression, expressionAttributeValues) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  owd.debug({ fn: "Entering queryItems", params: params }, "function: queryItems:");
  // Include IndexName only if it's provided
  if (indexName && indexName.length > 3) {
    params.IndexName = indexName;
  }
  const command = new QueryCommand(params);
  const response = await client.send(command);

  return response.Items;
};

/**
 * A private method to execute a statement using the
 * ExecuteStatementCommand. Use carefully so as to avoid running queries
 * that led to scanning the entire table.
 * @param {*} query
 */

const executeStatement = async (query) => {
  owd.debug({ fn: "Entering executeStatement", query: query }, "function: executeStatement:");
  const params = {
    Statement: query,
  };
  const command = new ExecuteStatementCommand(params);
  const response = await client.send(command);
  return response.Items;
};

const getNoticesByCid = async (cid, tableName = "db-notices") => {
  const query = `SELECT * FROM "${tableName}" WHERE "cid" = '${cid}'`;
  const items = await executeStatement(query);
  return items;
};

const getParentNoticesByCid = async (cid, tableName = "db-notices") => {
  const query = `SELECT * FROM "${tableName}" WHERE "cid" = '${cid}' AND isParent = true`;
  const items = await executeStatement(query);
  return items;
};

const getNoticesByParentId = async (cid, parentId, tableName = "db-notices") => {
  const query = `SELECT * FROM "${tableName}" WHERE "cid" = '${cid}'  AND "parentKey" = '${parentId}'`;
  const items = await executeStatement(query);
  return items;
};

/**
 * Deletes an item from a DynamoDB table. Only meant for tables with pk and/or sk and not for GSI.
 *
 * @param {string} tableName - The name of the table.
 * @param {string} pk - The partition key.
 * @param {string} sk - The sort key. (optional)
 * @returns {Promise<object>} - A promise that resolves to the response from DynamoDB.
 */
const deleteItem = async (tableName, pk, sk = null) => {
  const key = sk ? { pk: { S: pk }, sk: { S: sk } } : { pk: { S: pk } };
  owd.debug({ fn: "Entering deleteItem", key: key }, "function: deleteItem:");
  const params = {
    TableName: tableName,
    Key: key,
  };
  const command = new DeleteItemCommand(params);
  const response = await client.send(command);
  return response;
};

/**
 * Updates an item in the specified table. This is for simple set operations only.
 * If you need to perform more complex operations, use UpdateItemCommand directly.
 *
 * @param {string} tableName - The name of the table.
 * @param {object} item - The item to be updated. JSON object with key-value pairs.
 * @param {string} pk - The primary key of the item.
 * @param {string} sk - The sort key of the item (optional).
 * @returns {Promise<object>} - A promise that resolves to the response from the update operation.
 */
const updateItem = async (tableName, item, pk, sk = null) => {
  const key = sk ? { pk: { S: pk }, sk: { S: sk } } : { pk: { S: pk } };

  owd.debug({ fn: "Entering updateItem", item: item, key: key }, "function: updateItem:");

  // generate the update expression and expression attribute values
  let updateExpression = "SET ";
  const expressionAttributeValues = {};
  const itemKeys = Object.keys(item);
  for (let i = 0; i < itemKeys.length; i++) {
    const key = itemKeys[i];
    const value = item[key];
    updateExpression += `${key} = :${key}`;
    expressionAttributeValues[`:${key}`] = value;
    if (i < itemKeys.length - 1) {
      updateExpression += ", ";
    }
  }

  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW",
  };

  owd.debug(params, "updateItem params");

  const command = new UpdateItemCommand(params);
  const response = await client.send(command);
  return response;
};

export {
  getVersion,
  putItem,
  getItem,
  queryItems,
  deleteItem,
  updateItem,
  getS3Text,
  getParameter,
  getCustomerByEmail,
  getNoticesByCid,
  getParentNoticesByCid,
  executeStatement,
  encodeJWT,
  decodeJWT,
  getNoticesByParentId,
};
