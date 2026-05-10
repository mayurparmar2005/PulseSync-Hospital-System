package com.pulsesync.hospital_system.controller;

import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.UserRepository;
import com.pulsesync.hospital_system.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ---------------------------------------------------------
    // STEP 1: REQUEST OTP (For Patient Login/Registration)
    // ---------------------------------------------------------
    @PostMapping("/request-otp")
    public Map<String, Object> requestOtp(@RequestBody Map<String, String> data) {
        String mobile = data.get("mobile");

        if (mobile == null || mobile.length() != 10) {
            return Map.of("status", "error", "message", "Invalid mobile number.");
        }

        String otp = otpService.generateOtp();
        long expiryTime = System.currentTimeMillis() + OtpService.OTP_VALID_DURATION_MS;
        String signature = otpService.generateSignature(mobile, otp, expiryTime);

        System.out.println("=========================================");
        System.out.println("📲 SMS SENT TO: " + mobile);
        System.out.println("🔑 YOUR PULSESYNC OTP IS: " + otp);
        System.out.println("=========================================");

        return Map.of(
            "status", "success",
            "message", "OTP sent successfully",
            "expiryTime", expiryTime,
            "signature", signature
        );
    }

    // ---------------------------------------------------------
    // STEP 2: VERIFY OTP & AUTO-REGISTER PATIENT
    // ---------------------------------------------------------
    @PostMapping("/verify-otp")
    public Map<String, Object> verifyOtp(@RequestBody Map<String, Object> data) {
        String mobile = (String) data.get("mobile");
        String userOtp = (String) data.get("otp");
        long expiryTime = Long.parseLong(data.get("expiryTime").toString());
        String signature = (String) data.get("signature");

        boolean isValid = otpService.verifyOtp(mobile, userOtp, expiryTime, signature);

        if (!isValid) {
            return Map.of("status", "error", "message", "Invalid or Expired OTP.");
        }

        User user = userRepository.findByMobile(mobile);
        boolean isNewUser = false;

        if (user == null) {
            user = new User();
            user.setMobile(mobile);
            user.setFullName("Patient_" + mobile.substring(6)); 
            user.setRole("patient");
            user.setAbhaId("ABHA-" + UUID.randomUUID().toString().substring(0, 8));
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); 
            userRepository.save(user);
            isNewUser = true;
        }

        return Map.of(
            "status", "success",
            "isNewUser", isNewUser,
            "role", user.getRole(),
            "name", user.getFullName(),
            "mobile", user.getMobile(),
            "user", user
        );
    }

    // ---------------------------------------------------------
    // STEP 3: SECURE PASSWORD LOGIN (For Doctors & Receptionists)
    // ---------------------------------------------------------
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String identifier = credentials.get("identifier"); // This is the Email
        String password = credentials.get("password");

        User user = userRepository.findByEmail(identifier);

        // Verify user exists AND the passwords match cryptographically
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            return Map.of(
                "status", "success",
                "role", user.getRole(),
                "name", user.getFullName(),
                "user", user
            );
        }

        return Map.of("status", "error", "message", "Invalid credentials.");
    }
}