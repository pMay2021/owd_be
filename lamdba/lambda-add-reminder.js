// The Lambda function calculates reminder dates by taking an expiry date and list of number of days offsets as input. It parses the expiry date, loops through the offsets array, and calculates the reminder dates by adding each offset to the expiry date.
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
function getDayOfWeek(dateString) {
    // Validate input data
    if (!dateString) {
      throw new Error("Invalid input: dateString is required");
    }
  
    // Parse the date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  
    // Get the day of the week index (0-6, where 0 is Sunday)
    const dayOfWeekIndex = date.getDay();
  
    // Convert the index to a day name using an array
    const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    return daysOfWeek[dayOfWeekIndex];
  }

function calculateDates(expiryDate, daysList) {
    // Validate input data (same as your original code)
    console.log(`function calculateDates: expiryDate: ${expiryDate} and offsets: ${JSON.stringify(daysList)}`);
    if (!expiryDate || !Array.isArray(daysList)) {
      throw new Error("Invalid input data: expiryDate or daysList");
    }
  
    // Parse expiry date to a Date object (same as your original code)
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid expiry date format");
    }
  
    // Calculate new dates for each day in the list
    const newDates = daysList.map(days => {
      const newDate = new Date(parsedDate.getTime());
      newDate.setDate(newDate.getDate() - days);
  
      // Get day of the week in words (using the previous function)
      const dayOfWeek = getDayOfWeek(newDate.toISOString()); // Pass date as ISO string
  
      return {
        date: newDate.toISOString().slice(0, 10), // Format as YYYY-MM-dd
        dayOfWeek: dayOfWeek,
        offsetNumber: days
      };
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
    const newDates = calculateDates(expiresOn, offsetArray);
    console.log(`received notice dates: ${newDates}`)
    const retJson = { "notices" : newDates, "link" : data.Item.referenceURL.S };

    // Return a successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Record retrieved successfully.",
        data: retJson
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
