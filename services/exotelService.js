import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Backend-only Exotel Voice Service
 * Singapore Account
 */

function formatPhoneForExotel(phone) {
  if (!phone) return "";

  const digits = String(phone).replace(/\D/g, "");

  // 9876543210 -> 09876543210
  if (digits.length === 10) {
    return "0" + digits;
  }

  // 919876543210 -> 09876543210
  if (digits.length === 12 && digits.startsWith("91")) {
    return "0" + digits.slice(2);
  }

  // Already formatted
  return digits;
}

export async function callEmergencyContact(phoneNumber) {
  if (!phoneNumber) {
    return {
      success: false,
      error: "Emergency contact phone number is missing."
    };
  }

  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;
  const accountSid = process.env.EXOTEL_ACCOUNT_SID;
  const appId = process.env.EXOTEL_APP_ID;
  const exoPhone = process.env.EXOTEL_EXOPHONE;

  if (!apiKey || !apiToken || !accountSid || !appId || !exoPhone) {
    return {
      success: false,
      error: "Missing Exotel environment variables."
    };
  }

  const destinationNumber = formatPhoneForExotel(phoneNumber);
  const callerId = formatPhoneForExotel(exoPhone);

  // HTTPS ExoML URL
  const exomlUrl = `https://my.exotel.com/${accountSid}/exoml/start_voice/${appId}`;

  // Singapore Endpoint
  const endpoint = `https://api.exotel.com/v1/Accounts/${accountSid}/Calls/connect.json`;

  console.log("\n================ EXOTEL =================");
  console.log("Destination :", destinationNumber);
  console.log("Caller ID   :", callerId);
  console.log("Account SID :", accountSid);
  console.log("App ID      :", appId);
  console.log("Flow URL    :", exomlUrl);
  console.log("Endpoint    :", endpoint);
  console.log("=========================================\n");

  const params = new URLSearchParams();

  params.append("From", destinationNumber);
  params.append("CallerId", callerId);
  params.append("Url", exomlUrl);

  // Try Transactional call
  params.append("CallType", "trans");

  try {
    const response = await axios.post(endpoint, params, {
      auth: {
        username: apiKey,
        password: apiToken
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 15000
    });

    console.log("✅ Exotel Response");
    console.log(JSON.stringify(response.data, null, 2));

    return {
      success: true,
      data: response.data
    };

  } catch (err) {

    console.error("\n❌ Exotel Error");

    if (err.response) {
      console.error("Status :", err.response.status);
      console.error(JSON.stringify(err.response.data, null, 2));

      return {
        success: false,
        status: err.response.status,
        error: err.response.data
      };
    }

    console.error(err.message);

    return {
      success: false,
      error: err.message
    };
  }
}