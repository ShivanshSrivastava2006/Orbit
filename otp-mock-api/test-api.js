const axios = require('axios');

axios.post('http://localhost:5000/send-otp', {
  phone: "9876543210"
})
.then(res => {
  console.log("✅ Success:", res.data);
})
.catch(err => {
  if (err.response) {
    // Server responded with a status code outside 2xx
    console.log("❌ Server responded with error:", err.response.status, err.response.data);
  } else if (err.request) {
    // Request was made but no response received
    console.log("❌ No response received:", err.request);
  } else {
    // Other error
    console.log("❌ Unexpected error:", err.message);
  }
});
