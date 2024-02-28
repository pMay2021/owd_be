// this code works on lamdba. takes the test inputs and creates an array of reminder dates

import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

function calculateNewDates(expiryDate, daysList) {
  // Function to subtract days from a date and return in "YYYY-MM-DD" format
  const subtractDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result.toISOString().split("T")[0];
  };

  // Calculate new dates by subtracting days from the expiry date
  return daysList.map((days) => subtractDays(expiryDate, days));
}

function calculateDates(expiryDate, daysList) {
  // Validate input data
  console.log(`function calculateDates: expiryDate: ${expiryDate} and ${JSON.stringify(daysList)}`);
  if (!expiryDate || !Array.isArray(daysList)) {
    throw new Error("Invalid input data: expiryDate or daysList");
  }

  // Parse expiry date to a Date object
  const parsedDate = new Date(expiryDate);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid expiry date format");
  }

  // Calculate new dates for each day in the list
  const newDates = daysList.map(days => {
    const newDate = new Date(parsedDate.getTime());
    newDate.setDate(newDate.getDate() - days);
    return newDate.toISOString().slice(0, 10); // Format as YYYY-MM-dd
  });

  return newDates;
}

// The Lambda handler function
export const handler = async (event, context) => {
  // Initialize DynamoDB client
  const client = new DynamoDBClient({ region: "us-east-1" });

  try {
    // Extract id and state from the event object
    const { id, state, expiresOn } = event;
    console.log(`${context.functionName}: received event: ${JSON.stringify(event)}: id = ${id} and state = ${state}`);

    // Create parameters for DynamoDB get-item
    const params = { TableName: "db-document", Key: { id: { S: id }, state: { S: state } } };

    // Create a command to get the item
    const command = new GetItemCommand(params);

    // Send the command to DynamoDB
    const data = await client.send(command);

    // We now have the document related details. Let's use the reminderIntervals
    // to compute three dates that correspond to the period between now and then
    let offsetArray = data.Item.reminderOffsetDays.L.map((x) => x.N);
    console.log(`offsetArray: ${offsetArray.flat()}`); // Output: Array of new date strings
    const newDates = calculateDates(expiresOn, offsetArray);
    console.log(`computed reminder dates: ${newDates}`); // Output: Array of new date strings

    // Return a successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Record retrieved successfully.",
        data: data.Item,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error(error);

    // Return an error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to retrieve item" }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
