const https = require("https");
const dotenv = require("dotenv");
dotenv.config();

const sendOtpViaMSG91 = async (mobile, otp) => {
  console.log(mobile, otp);
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: "api.msg91.com",
      path: "/api/v5/flow/",
      headers: {
        authkey: process.env.AUTH_KEY,
        "content-type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => chunks.push(chunk));

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        console.log("OTP Sent:", body);
        resolve(body);
      });
    });

    req.on("error", (err) => {
      console.error("Error sending OTP:", err);
      reject(err);
    });

    const payload = {
      flow_id: "63614b3dabf10640e61fa856",
      sender: "DSMONL",
      mobiles: `91${mobile}`,
      otp: otp,
    };

    req.write(JSON.stringify(payload));
    req.end();
  });
};

module.exports = { sendOtpViaMSG91 };
