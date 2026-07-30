import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

// ---------------------
// Example API route
// ---------------------
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// ---------------------
// Exotel SOS Call API
// ---------------------
app.post("/api/sos/call", async (req, res) => {
  try {
    const { userNumber, emergencyNumber } = req.body;

    if (!userNumber || !emergencyNumber) {
      return res.status(400).json({
        success: false,
        message: "userNumber and emergencyNumber are required.",
      });
    }

    const exotelUrl = `https://${process.env.EXOTEL_SUBDOMAIN}/v1/Accounts/${process.env.EXOTEL_ACCOUNT_SID}/Calls/connect`;

    const params = new URLSearchParams();
    params.append("From", userNumber);
    params.append("To", emergencyNumber);
    params.append("CallerId", process.env.EXOTEL_CALLER_ID);

    const response = await axios.post(exotelUrl, params, {
      auth: {
        username: process.env.EXOTEL_API_KEY,
        password: process.env.EXOTEL_API_TOKEN,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("Exotel Response:", response.data);

    res.json({
      success: true,
      message: "Call initiated successfully.",
      data: response.data,
    });

  } catch (error) {
    console.error(
      "Exotel Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// ---------------------
// 404 handler for API routes
// ---------------------
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "Not Found",
      path: req.originalUrl,
    });
  }
  next();
});

// ---------------------
// React/Vite SPA fallback
// ---------------------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------------------
// Global Error Handler
// ---------------------
app.use((err, req, res, next) => {
  console.error(
    "Unhandled server error:",
    err?.stack || err
  );

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development"
      ? { stack: err.stack }
      : {}),
  });
});

// ---------------------
// Start Server
// ---------------------
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});