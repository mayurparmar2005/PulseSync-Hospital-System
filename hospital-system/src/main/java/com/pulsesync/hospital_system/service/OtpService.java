package com.pulsesync.hospital_system.service;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Random;

@Service
public class OtpService {

    // In a real production app, keep this secret key in application.properties
    private static final String SECRET_KEY = "PulseSync_Super_Secret_Crypto_Key_2026";
    public static final long OTP_VALID_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    // 1. Generate a random 6-digit OTP
    public String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // 2. Cryptographically sign the OTP + Mobile + Expiry using HMAC-SHA256
    public String generateSignature(String mobile, String otp, long expiryTime) {
        try {
            String data = mobile + ":" + otp + ":" + expiryTime;
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC signature", e);
        }
    }

    // 3. Verify the signature mathematically
    public boolean verifyOtp(String mobile, String userOtp, long expiryTime, String providedSignature) {
        // Check if expired
        if (System.currentTimeMillis() > expiryTime) {
            return false; 
        }
        // Re-calculate the signature based on what the user provided
        String expectedSignature = generateSignature(mobile, userOtp, expiryTime);
        
        // If the signatures match exactly, the OTP is valid and untouched
        return expectedSignature.equals(providedSignature);
    }
}