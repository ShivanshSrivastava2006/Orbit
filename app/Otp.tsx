// app/Otp.tsx
import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams(); // phone passed via URL
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("send");

  useEffect(() => {
    if (phone) {
      sendOtp();
    }
  }, [phone]);

  const sendOtp = async () => {
    try {
      const res = await fetch("http://192.168.225.101:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      Alert.alert("OTP Sent", data.message);
      setStep("verify");
    } catch (err) {
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await fetch("http://192.168.225.101:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.message.toLowerCase().includes("verified")) {
        Alert.alert("Success", data.message);
        router.replace("/(tabs)/home"); // ✅ make sure this path matches your home route
      } else {
        Alert.alert("Failed", data.message);
      }
    } catch (err) {
      Alert.alert("Error", "Verification failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>OTP sent to: {phone}</Text>
      <TextInput
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Verify OTP" onPress={verifyOtp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  input: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
  },
});
