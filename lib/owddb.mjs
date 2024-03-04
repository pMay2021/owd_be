import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({ region: "us-east-1" });
const testCID = "HbWUAV7JaA6cio3"

/**
 * returns info on this module
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: "1.0.0",
    date: "2024-03-03",
    details: "DB wrapper lib for DynamoDB with reusable functions",
    changes: "initial.",
  };
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

  const command = new PutItemCommand(params);
  const response = await client.send(command);

  return response;
};

/**
 * Gets an item from a DynamoDB table. Only meant for tables with pk and/or sk and not for GSI.
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

  const command = new GetItemCommand(params);
  const response = await client.send(command);

  return response.Item;
};

/**
 * Queries a DynamoDB table using a GSI. * @param {string} tableName - The name of the table.
 * @param {string} indexName - The name of the GSI.
 * @param {string} keyConditionExpression - The key condition expression. E.g.,"email = :email"
 * @param {object} expressionAttributeValues - The expression attribute values. E.g.,{ ":email": { S: email }},
 * @returns {Promise<object[]>} - A promise that resolves to an array of items from the table.
 */
const getItemByGSI = async (tableName, indexName, keyConditionExpression, expressionAttributeValues) => {
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  const command = new QueryCommand(params);
  const response = await client.send(command);

  return response.Items;
  A;
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
  
  owd.log(params, "\nUpdateItems params");
  const command = new UpdateItemCommand(params);
  const response = await client.send(command);
  return response;
};


export { getVersion, putItem, getItem, getItemByGSI, deleteItem, updateItem };