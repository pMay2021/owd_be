const axios = require("axios");

let jwtToken = "";
let email = "dummy" + Math.random().toString(36).substring(7) + "@gmail.com";

const register = () => {
  return axios
    .post("https://77uxp6az23.execute-api.us-east-1.amazonaws.com/v1/api/customer/register", {
      email: email,
      token: "abcde",
    })
    .then((response) => {
      if (response.status === 200) {
        jwtToken = response.data.detail.jwt;
      }
    });
};

const verify = () => {
  return axios
    .post(`https://77uxp6az23.execute-api.us-east-1.amazonaws.com/v1/api/customer/verify?email=${email}&token=${jwtToken}`)
    .then((response) => {
      if (response.status === 200) {
        jwtToken = response.data.detail.jwt;
      }
    });
};

const login = () => {
  return axios
    .post(`https://77uxp6az23.execute-api.us-east-1.amazonaws.com/v1/api/customer/loginrequest?email=${email}&token=${jwtToken}`)
    .then((response) => {
      if (response.status === 200) {
        jwtToken = response.data.detail.jwt;
      }
    });
};

const update = () => {
  return axios.post(`https://77uxp6az23.execute-api.us-east-1.amazonaws.com/v1/api/customer/update?token=${jwtToken}`, {
    nickName: "Slartibarfact",
    cellNumber: "+1732-599-5930",
    countryCode: "us",
    stateCode: "wa",
    sendEmail: "true",
    sendSMS: "true",
    sendWhatsapp: "false",
    sendMarketingEmails: "false",
    sendTopicUpdates: "false",
    sendPush: "false",
    ccOnByDefault: "true",
    emailCC: ["ghiga@shunga.com", "shuga@binga.com"],
  });
};

register()
  .then(() => setTimeout(verify, 1000))
  .then(() => setTimeout(login, 1000))
  .then(() => setTimeout(update, 1000))
  .catch((error) => console.error(error));
