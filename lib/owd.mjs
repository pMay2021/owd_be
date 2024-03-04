import { customAlphabet } from "nanoid";

/**
 * returns info on this module
 *
 * @returns {object} A JSON object with module's version and additional details
 */

const getVersion = () => {
  return {
    version: "1.0.8",
    date: "2024-03-03",
    details: "generic lib with multitude of reusable functions and table ops",
    changes: "cellNumber validation",
  };
};

/**
 * Logs the given object to the console.
 *
 * @param {any} obj - The object to be logged.
 * @param {string} [title=""] - The title for the log message.
 * @param {boolean} [on=true] - Determines whether the log message should be displayed.
 * @returns {void}
 */
const log = (obj, title = "", on = true) => {
  if (!on) return;

  const msg = `${title}\n${"=".repeat(title.length)}\n${JSON.stringify(obj, null, 2)}`;
  console.log(msg);
};

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
};

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

  return {
    years,
    months,
    days,
  };

  // Build the friendly English string (keep it here to use later in the FE code)
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
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 15);
  const id = nanoid(numberOfDigits > defaultLength || numberOfDigits < 4 ? defaultLength : numberOfDigits);
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
      display: getFriendlyDateDifference(newDate.toISOString().slice(0, 10), expiryDate),
    };
  });

  return newDates;
};

const isValidEmail = (email) => {
  email = email.toLowerCase().trim();
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

/**
 * Validates a US cell number and returns a formatted version.
 * @param {string} cellNumber - The cell number to validate.
 * @returns {string|null} - The formatted cell number, or null if the number is invalid.
 */
const normalizeCellNumber = (cellNumber) => {
  if (!cellNumber) return "+10000000000";
  cellNumber = cellNumber.replace(/\D/g, "");
  if (cellNumber.length === 10) {
    return "+1" + cellNumber;
  } else if (cellNumber.length === 11 && cellNumber.startsWith("1")) {
    return "+" + cellNumber;
  } else {
    return null;
  }
};

export {
  getDayOfWeek,
  getShortId,
  getOffsetDates,
  getVersion,
  getNumberOfDaysBetweenDates,
  getFriendlyDateDifference,
  log,
  isValidEmail,
  normalizeCellNumber,
};
