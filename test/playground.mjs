import * as owd from "../lib/owd.mjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();


const encodeJWT = (customerId, expiresIn = "1h") => {
  const secret = "abcDEF123"
  if(!secret) {
    throw new Error("JWT secret not found");
  }
  const options = { expiresIn: expiresIn };
  return jwt.sign({ cid: customerId }, secret, options);
}

const decodeJWT = (token) => {
  const secret = "abcDEF123"
  if(!secret) {
    throw new Error("JWT secret not found");
  }
  return jwt.verify(token, secret);
}

//owd.log(owd.getOffsetDates("2029-10-13", ["24", "30", "60", "0", "180"]));
//owd.log(owd.getFriendlyDate("2024-03-30"));
//owd.log(owd.getMagicLink(30));

try {

  const formattedTime = new Date().toLocaleDateString("en-US", {
    weekday: "long",  // Includes weekday name (e.g., "Thu")
    month: "long",     // Includes full month name (e.g., "March")
    day: "numeric",    // Includes day of month with digits (e.g., "20")
  }) + " " + 
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",    // Includes hour with two digits (e.g., "21")
    minute: "2-digit",  // Includes minutes with two digits (e.g., "25")
    hour12: true       // Ensures 12-hour format with AM/PM
  });

  console.log(formattedTime);

  const customerId = 'xQuitter'; // Your 15-character customer ID
} catch (error) {
  console.error(error.message);
}