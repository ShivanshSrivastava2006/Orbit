const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const otpStore = {}; // In-memory store: { phone: otp }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
app.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const otp = generateOTP();
  otpStore[phone] = otp;
  console.log(`📲 OTP for ${phone}: ${otp}`);

  res.json({ message: `OTP sent to ${phone}` });
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  if (otpStore[phone] === otp) {
    delete otpStore[phone]; // remove OTP once verified
    return res.json({ message: "✅ OTP verified" });
  } else {
    return res.status(401).json({ message: "❌ Invalid OTP" });
  }
});

app.listen(port, () => {
  console.log("🚀 Server file loaded");
  console.log(`✅ Server running at http://localhost:${port}`);
});
