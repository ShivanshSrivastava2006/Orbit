import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function OtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { phone } = route.params || {}; // phone passed via URL
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("send");

  useEffect(() => {
    if (phone) {
      sendOtp();
    }
  }, [phone]);

  const sendOtp = async () => {
    try {
      const res = await fetch("http://192.168.0.185:5050/send-otp", {
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
      const res = await fetch("http://192.168.0.185:5050/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.message.toLowerCase().includes("verified")) {
        Alert.alert("Success", data.message);
        navigation.replace('FriendSelector'); 
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
