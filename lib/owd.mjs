import { customAlphabet } from "nanoid";

/**
 * Gets the day of the week (Sunday: 0, Monday: 1, etc.) for a given date string.
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: "1.0.0",
    date: "2024-02-28",
    details: "This module provides functions for calculating dates and IDs.",
  };
}

/**
 * Gets the day of the week (Sunday: 0, Monday: 1, etc.) for a given date string.
 *
 * @param {string} dateString The date string in a valid format (e.g., "2023-11-19").
 * @returns {string} The day of the week as a string (e.g., "Sun").
 */

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

/**
 * Generates a short and unique ID of a specified length.
 *
 * @param {number} [numberOfDigits=15] The desired length of the ID (default: 12).
 * @returns {string} The generated short ID.
 */
const getShortId = (numberOfDigits = 15) => {
  const defaultLength = 15;
  const nanoid = customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    15,
  );
  const id = nanoid(
    numberOfDigits > defaultLength || numberOfDigits < 4 ? defaultLength : numberOfDigits,
  );
  return id;
};

/**
 * Calculates a list of dates offset from a given expiry date.
 *
 * @param {string} expiryDate The expiry date in a valid format (e.g., "2023-11-19").
 * @param {number[]} offsetDays An array of integer offsets (negative for past, positive for future).
 * @returns {object[]} An array of objects containing the new date, day of the week, and offset number.
 */
const getOffsetDates = (expiryDate, offsetDays) => {
  console.log(
    `function calculateDates: expiryDate: ${expiryDate} and offsets: ${JSON.stringify(offsetDays)}`,
  );
  if (!expiryDate || !Array.isArray(offsetDays)) {
    throw new Error("Invalid input data: expiryDate or daysList");
  }

  // Parse expiry date to a Date object (same as your original code)
  const parsedDate = new Date(expiryDate);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid expiry date format");
  }

  // Calculate new dates for each day in the list
  const newDates = offsetDays.map((days) => {
    const newDate = new Date(parsedDate.getTime());
    newDate.setDate(newDate.getDate() - days);

    // Get day of the week in words (using the previous function)
    const dayOfWeek = getDayOfWeek(newDate.toISOString()); // Pass date as ISO string

    return {
      date: newDate.toISOString().slice(0, 10), // Format as YYYY-MM-dd
      dayOfWeek: dayOfWeek,
      offsetNumber: days,
    };
  });

  return newDates;
};

export { getDayOfWeek, getShortId, getOffsetDates, getVersion };
