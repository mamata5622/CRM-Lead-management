const twilio = require("twilio");

let client = null;

function getSmsClient() {
  if (!client) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio SMS configuration is missing.");
    }

    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

async function sendOtpSms(to, otp) {
  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER is not configured.");
  }

  return getSmsClient().messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
    body: `Your password reset verification code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this message.`,
  });
}

module.exports = { sendOtpSms };