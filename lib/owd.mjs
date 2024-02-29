import { customAlphabet } from "nanoid";

const getDayOfWeek = (dateString) => {
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
};

const getShortId = (numberOfDigits = 12) => {
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 15);
  const id = nanoid((numberOfDigits > 15 || numberOfDigits < 4) ? 15 : numberOfDigits);
  console.log("nanoid: " + id);
  return id;
};

const calculateDates = (expiryDate, offsetDays) => {
    console.log(`function calculateDates: expiryDate: ${expiryDate} and offsets: ${JSON.stringify(offsetDays)}`);
    if (!expiryDate || !Array.isArray(offsetDays)) {
      throw new Error("Invalid input data: expiryDate or daysList");
    }
  
    // Parse expiry date to a Date object (same as your original code)
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid expiry date format");
    }
  
    // Calculate new dates for each day in the list
    const newDates = offsetDays.map(days => {
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

export { getDayOfWeek, getShortId, calculateDates };