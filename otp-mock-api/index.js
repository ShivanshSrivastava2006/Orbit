const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 5050;

app.use(cors());
app.use(bodyParser.json());

const otpStore = {}; // In-memory store: { phone: otp }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
app.get('/', (req, res) => {
  res.send("✅ API is live");
});


// Send OTP
app.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    console.log("❌ [send-otp] Missing phone");
    return res.status(400).json({ message: "Phone number is required" });
  }

  const otp = generateOTP();
  otpStore[phone] = otp;
  console.log(`📲 [send-otp] OTP for ${phone}: ${otp}`);

  res.json({ message: `OTP sent to ${phone}` });
});

// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  console.log(`🔍 [verify-otp] phone: ${phone}, otp: ${otp}`);
  console.log("🗃️  Current otpStore:", otpStore);

  if (!phone || !otp) {
    console.log("❌ [verify-otp] Missing phone or otp");
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  if (otpStore[phone] === otp) {
    console.log(`✅ [verify-otp] OTP match for ${phone}`);
    delete otpStore[phone];
    return res.json({ message: "✅ OTP verified" });
  } else {
    console.log(`❌ [verify-otp] OTP mismatch for ${phone}`);
    return res.status(401).json({ message: "❌ Invalid OTP" });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log("🚀 Server file loaded");
  console.log(`✅ Server running at http://0.0.0.0:${port}`);
});


setInterval(() => {}, 1000);