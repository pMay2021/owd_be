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
  const customerId = 'xQuitter'; // Your 15-character customer ID
  const token = encodeJWT(customerId);
  console.log('JWT:', token);

  const decoded = decodeJWT(token);
  console.log('Decoded:', decoded);
} catch (error) {
  console.error(error.message);
}