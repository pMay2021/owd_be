import { customAlphabet } from "nanoid";

const VERSION = "1.0.2";

/**
 * returns info on this module
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: VERSION,
    date: "2024-02-28",
    details: "This module provides functions for calculating dates and IDs.",
  };
}

/**
 * Calculates the number of days between two dates.
 *
 * @param {string|Date} date1 - The first date.
 * @param {string|Date} date2 - The second date.
 * @returns {number} The number of days between the two dates.
 */
const getNumberOfDaysBetweenDates = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
  return diffDays;
}

/**
 * Calculates the friendly date difference between two dates.
 * 
 * @param {string|Date} date1 - The first date. date1 is the older or earlier date. e.g., "2023-06-19" 
 * @param {string|Date} date2 - The second date. e.g., "2025-10-25"
 * @returns {string} The friendly date difference in the format "x years x months x days".
 */
function getFriendlyDateDifference(date1, date2) {
  // Parse the dates
  let d1 = new Date(date1);
  let d2 = new Date(date2);

  // Calculate the difference in years, months, and days
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  // Adjust the years, months, and days if necessary
  if (days < 0) {
      months--;
      days += new Date(d1.getFullYear(), d1.getMonth() + 1, 0).getDate();
  }
  if (months < 0) {
      years--;
      months += 12;
  }

  // Build the friendly English string
  let result = "";
  if (years > 0) result += years + " year" + (years > 1 ? "s, " : " ");
  if (months > 0) result += months + " month" + (months > 1 ? "s, " : " ");
  if (days > 0) result += days + " day" + (days > 1 ? "s" : "");

  return result.trim();
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

export { getDayOfWeek, getShortId, getOffsetDates, getVersion, getNumberOfDaysBetweenDates, getFriendlyDateDifference };