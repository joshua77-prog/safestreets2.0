import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

/**
 * Backend-only Twilio Voice Service
 */

function formatPhoneForTwilio(phone) {
  if (!phone) return "";

  const trimmed = String(phone).trim();
  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, "");

  // 6382691953 -> +916382691953
  if (digits.length === 10) {
    return "+91" + digits;
  }

  // 916382691953 -> +916382691953
  if (digits.length === 12 && digits.startsWith("91")) {
    return "+" + digits;
  }

  // 06382691953 -> +916382691953
  if (digits.length === 11 && digits.startsWith("0")) {
    return "+91" + digits.slice(1);
  }

  return "+" + digits;
}

/**
 * Phonetic pronunciation helper for TTS engine
 */
function formatNameForTTS(name) {
  if (!name || typeof name !== "string") return "A Safe Streets user";

  let formatted = name.trim();
  if (!formatted) return "A Safe Streets user";

  // Replace names with phonetic/syllable-spaced forms for clear speech synthesis
  formatted = formatted.replace(/Keerrthana/gi, "Keer-tha-na");
  formatted = formatted.replace(/Keerthana/gi, "Keer-tha-na");

  return formatted;
}

export async function callEmergencyContact(phoneNumber, userName = "A Safe Streets user") {
  if (!phoneNumber) {
    return {
      success: false,
      error: "Emergency contact phone number is missing."
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    console.error("❌ Missing Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).");
    return {
      success: false,
      error: "Twilio credentials are missing in server environment variables."
    };
  }

  const destinationNumber = formatPhoneForTwilio(phoneNumber);
  const rawName = (userName && String(userName).trim()) || "";
  const nameToUse = rawName ? formatNameForTTS(rawName) : "A Safe Streets user";

  try {
    const client = twilio(accountSid, authToken);

    console.log("\n================ TWILIO VOICE =================");
    console.log("Destination :", destinationNumber);
    console.log("Twilio From :", twilioPhone);
    console.log("TTS Name    :", nameToUse);
    console.log("===============================================\n");

    const callMessage = `This is an automated emergency alert from Safe Streets. ${nameToUse} has triggered an SOS alert and may need immediate assistance. Please check on ${nameToUse} immediately.`;

    const call = await client.calls.create({
      to: destinationNumber,
      from: twilioPhone,
      twiml: `<Response><Say voice="alice">${callMessage}</Say></Response>`
    });

    console.log(`✅ Twilio call dispatched successfully. Call SID: ${call.sid}`);

    return {
      success: true,
      callSid: call.sid,
      status: call.status
    };
  } catch (err) {
    console.error("❌ Twilio Voice call error:", err.message);
    return {
      success: false,
      error: err.message,
      code: err.code || null
    };
  }
}
