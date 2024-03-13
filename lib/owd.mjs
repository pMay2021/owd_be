import { customAlphabet } from "nanoid";
import { marked } from "marked";
import * as crypto from "crypto";

/**
 * Returns information about this module.
 *
 * @returns {object} A JSON object with the module's version and additional details.
 */
const getVersion = () => {
  return {
    version: "1.5.1",
    date: "2024-03-06",
    details: "lib with multitude of reusable functions, nanoid, marked, and more.",
    changes: "Now with JSON response wrapper and HTTP error codes",
  };
};

/**
 * A dictionary of HTTP error codes and their corresponding messages.
 */
const httpErrorCodes = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
};

/**
 * Converts Markdown to HTML.
 *
 * @param {string} markdown - The Markdown string to convert.
 * @returns {string} The HTML string converted from the Markdown.
 */
const getHtmlFromMarkdown = (markdown) => {
  return marked(markdown);
};

/**
 * Picks a random value from the given array.
 *
 * @param {Array} array - The array from which to pick a random value.
 * @returns {*} The randomly picked value from the array.
 */
const pickRandomValue = (array) => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
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

  const msg = `\n${title}\n${"=".repeat(title.length)}\n${JSON.stringify(obj, null, 2)}`;
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
 * Calculates date difference between two dates and returns a friendly object
 *
 * @param {string|Date} earlierDate - The earlier date.e.g., "2023-06-19"
 * @param {string|Date} newerDate - The newer date. e.g., "2025-10-25"
 * @returns {object} info on the difference between the two dates.
 */
function getFriendlyDateDifference(earlierDate, newerDate) {
  // Parse the dates
  let d1 = new Date(earlierDate);
  let d2 = new Date(newerDate);

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
  let sentence = "";
  if (years > 0) sentence += years + " year" + (years > 1 ? "s, " : " ");
  if (months > 0) sentence += months + " month" + (months > 1 ? "s, " : " ");
  if (days > 0) sentence += days + " day" + (days > 1 ? "s" : "");

  if (days === 0 && months === 0 && years === 0) sentence = "today";

  return {
    earlierDate: earlierDate,
    newerDate: newerDate,
    y: years,
    m: months,
    d: days,
    isToday: earlierDate === newerDate,
    dueInSentence: sentence.trim(),
  };
}

/**
 * Converts a date to a friendly format like "On Friday, 12th Feb, 2025."
 *
 * @param {string|Date} date - The date to be converted.
 * @returns {string} The date in the friendly format.
 */
function getFriendlyDate(date) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(date);
  const dayOfWeek = daysOfWeek[d.getDay()];
  const day = d.getDate();
  console.log(day);
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const suffix = getNumberSuffix(day);
  return `${dayOfWeek}, ${day}${suffix} ${month}, ${year}`;
}

/**
 * Returns the suffix for a given number.
 *
 * @param {number} number - The number to get the suffix for.
 * @returns {string} The suffix for the number.
 */
function getNumberSuffix(number) {
  if (number >= 11 && number <= 13) {
    return "th";
  }
  const lastDigit = number % 10;
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Gets the day of the week (Sunday: 0, Monday: 1, etc.) for a given date string.
 *
 * @param {string} dateString - The date string in a valid format (e.g., "2023-11-19").
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
 * @param {number} [numberOfDigits=15] - The desired length of the ID (default: 12).
 * @param {string} [customAlphabet="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"] - The custom alphabet to use for generating the ID (default: all alphanumeric characters).
 * @returns {string} The generated short ID.
 */
const getShortId = (numberOfDigits = 15, customDigits = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") => {
  const defaultLength = 15;
  const nanoid = customAlphabet(customDigits, 15);
  const id = nanoid(numberOfDigits > defaultLength || numberOfDigits < 4 ? defaultLength : numberOfDigits);
  return id;
};

/**
 * Calculates a list of dates offset from a given expiry date.
 *
 * @param {string} expiryDate - The expiry date in a valid format (e.g., "2023-11-19").
 * @param {number[]} offsetDays - An array of integer offsets (negative for past, positive for future).
 * @param {boolean} [sanitize=true] - A flag to indicate whether to sanitize the input data (default: true). When sanitizing, the function will remove any dates that are in the past from the offset. If the function returns empty, the caller should use the expiry date as the notification date.
 * @returns {object[]} An array of objects containing the new date, day of the week, and offset number.
 */
const getOffsetDates = (expiryDate, offsetDays, sanitize = true) => {
  if (!expiryDate || !Array.isArray(offsetDays)) {
    throw new Error("Invalid input data: expiryDate or daysList");
  }

  //let's create a complete offsetDays collection
  const completeOffsetDays = [...new Set([...offsetDays, 0, 1, 7])];

  // Parse expiry date to a Date object (same as your original code)
  const parsedDate = new Date(expiryDate);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid expiry date format");
  }

  const today = new Date();
  // Calculate new dates for each day in the list
  let newDates = completeOffsetDays.map((days) => {
    const newDate = new Date(parsedDate.getTime());
    newDate.setDate(newDate.getDate() - days);
    if (sanitize && newDate < today) return null;

    // Get day of the week in words (using the previous function)
    const dayOfWeek = getDayOfWeek(newDate.toISOString()); // Pass date as ISO string

    return {
      date: newDate.toISOString().slice(0, 10), // Format as YYYY-MM-dd
      dayOfWeek: dayOfWeek,
      dueInDays: days,
      display: getFriendlyDateDifference(newDate.toISOString().slice(0, 10), expiryDate),
    };
  });

  newDates = newDates.filter((date) => date !== null);

  return newDates;
};

/**
 * Checks if an email address is valid.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email address is valid, false otherwise.
 */
const isValidEmail = (email) => {
  email = email.toLowerCase().trim();
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

/**
 * Validates a US cell number and returns a formatted version.
 *
 * @param {string} cellNumber - The cell number to validate.
 * @returns {string|null} The formatted cell number, or null if the number is invalid.
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

/**
 * Generates a JSON response object with the given status code and optional message.
 *
 * @param {number} code - The HTTP status code.
 * @param {string} [message=""] - an optional message to be included in the response.
 * @returns {object} The JSON response object.
 */
function getResponseJSON(code, message = "") {
  const msg = (httpErrorCodes[code] || "Unknown Error") + " | " + message;
  const ret = {
    statusCode: code,
    body: msg,
    headers: {
      "Content-Type": "application/json",
    },
  };

  return ret;
}

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
  getFriendlyDate,
  getHtmlFromMarkdown,
  pickRandomValue,
  getResponseJSON
};
