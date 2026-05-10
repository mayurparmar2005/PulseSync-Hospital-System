package com.pulsesync.hospital_system.controller;

import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private UserRepository userRepository;

    // FIX #2 + #7: BCrypt for default password; FIX #7: use setMobile (not
    // setPhone)
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public Map<String, Object> registerPatient(@RequestBody Map<String, String> data) {
        String name = data.get("name");
        String mobile = data.get("mobile");
        int age = Integer.parseInt(data.get("age"));
        String gender = data.get("gender");
        
        // NEW: Capture custom password if provided (for self-registration)
        String rawPassword = data.get("password"); 

        // 1. Check if patient already exists (by mobile)
        if (userRepository.findByMobile(mobile) != null) {
            return Map.of("status", "error", "message", "Patient already exists with this mobile!");
        }

        // 2. Create new Patient User
        User newPatient = new User();
        newPatient.setFullName(name);
        newPatient.setMobile(mobile);
        newPatient.setAge(age);
        newPatient.setGender(gender);
        newPatient.setRole("patient");

        // NEW: If self-registering, hash their custom password. 
        // If walked-in via reception, use default "pulse123".
        if (rawPassword != null && !rawPassword.trim().isEmpty()) {
            newPatient.setPassword(passwordEncoder.encode(rawPassword));
        } else {
            newPatient.setPassword(passwordEncoder.encode("pulse123"));
        }
        
        newPatient.setAbhaId("ABHA-" + UUID.randomUUID().toString().substring(0, 8));

        // 3. Save to MongoDB
        userRepository.save(newPatient);

        return Map.of(
                "status", "success",
                "message", "Patient Registered Successfully!",
                "abha", newPatient.getAbhaId()
        );
    }

    // --- GET Patient Profile (for Settings Page & QR display) ---
    @GetMapping
    public Map<String, Object> getPatient(@RequestParam String mobile) {
        User patient = userRepository.findByMobile(mobile);
        if (patient == null) {
            return Map.of("status", "error", "message", "Patient not found");
        }
        return Map.of(
                "status", "success",
                "name", patient.getFullName() != null ? patient.getFullName() : "",
                "mobile", patient.getMobile() != null ? patient.getMobile() : "",
                "abhaId", patient.getAbhaId() != null ? patient.getAbhaId() : "Not Assigned",
                "age", patient.getAge(),
                "gender", patient.getGender() != null ? patient.getGender() : "");
    }
}