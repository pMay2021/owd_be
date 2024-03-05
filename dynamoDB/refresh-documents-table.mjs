/*
 * this code refreshes all entries in the db-document table
 * it deletes all existing entries and then recreates from the json below
 * it is meant to be run only once to refresh the table
 * it is not meant to be run in production
 */

import * as owd from "/opt/nodejs/node20/owd.mjs";
import * as db from "/opt/nodejs/node20/owddb.mjs";
const goModify = false;
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // ES Modules import
const client = new S3Client(config);

// Specify the S3 bucket and file path
const bucketName = "onwhichdate";
const filePath = "db/db-document.tsv";

// Read the file from S3 bucket
const input = {
  Bucket: bucketName,
  Key: filePath,
};

const command = new GetObjectCommand(input);
const response = await client.send(command);

owd.log(response, "S3 response");

// Split the data into rows
const rows = data.split("\n");

// Get the column names from the first row
const columnNames = rows[0].split("\t");

// Iterate over the rows starting from the second row
for (let i = 1; i < rows.length; i++) {
  const row = rows[i].split("\t");

  // Create the entry object
  const entry = {};
  for (let j = 0; j < columnNames.length; j++) {
    entry[columnNames[j]] = row[j];
  }

  // Check if the primary key exists
  const pk = entry.pk;
  const sk = entry.sk;

  owd.log(entry, "entry");

  if (goModify) {
    const existingItem = await db.getItem(pk, sk);

    if (existingItem) {
      // Update the existing entry
      await db.updateItem(pk, sk, entry);
    } else {
      // Insert a new entry
      await db.putItem(pk, sk, entry);
    }
  }
}
