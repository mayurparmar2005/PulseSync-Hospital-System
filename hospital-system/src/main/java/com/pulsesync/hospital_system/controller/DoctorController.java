package com.pulsesync.hospital_system.controller;
import org.springframework.lang.NonNull;
import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private UserRepository userRepository;

    // 1. Get All Doctors (for the Doctors Page)
    @GetMapping
    public List<User> getAllDoctors() {
        return userRepository.findAll().stream()
                .filter(u -> "doctor".equals(u.getRole()))
                .collect(Collectors.toList());
    }

    // 2. Rate a Doctor
    @PostMapping("/{id}/rate")
    public Map<String, Object> rateDoctor(@PathVariable @NonNull String id, @RequestBody Map<String, Integer> payload) {
        int newStar = payload.get("stars"); // User gives 1 to 5 stars

        // Find the doctor
        User doctor = userRepository.findById(id).orElse(null);
        if (doctor == null) return Map.of("status", "error", "message", "Doctor not found");

        // Calculate new Average
        // Formula: ((OldRating * Count) + NewStar) / (Count + 1)
        double currentTotal = doctor.getRating() * doctor.getReviewCount();
        double newTotal = currentTotal + newStar;
        int newCount = doctor.getReviewCount() + 1;
        double newAverage = Math.round((newTotal / newCount) * 10.0) / 10.0; // Round to 1 decimal

        // Save
        doctor.setRating(newAverage);
        doctor.setReviewCount(newCount);
        userRepository.save(doctor);

        return Map.of("status", "success", "newRating", newAverage, "count", newCount);
    }

    // 3. Update Doctor Status (Active / Break / Offline)
    @PostMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable @NonNull String id, @RequestBody Map<String, String> data) {
        String newStatus = data.get("status"); // "AVAILABLE", "BREAK", "OFFLINE"
        
        User doctor = userRepository.findById(id).orElse(null);
        if (doctor != null) {
            doctor.setDoctorStatus(newStatus);
            userRepository.save(doctor);
            return Map.of("status", "success", "message", "Status updated to " + newStatus);
        }
        return Map.of("status", "error", "message", "Doctor not found");
    }
    
    @PostMapping("/add")
    public Map<String, Object> addDoctor(@RequestBody Map<String, String> data) {
        String name = data.get("name");
        String spec = data.get("specialization");
        String email = data.get("email");
        String password = data.get("password");

        // Check if doctor already exists
        if (userRepository.findByEmail(email) != null) {
            return Map.of("status", "error", "message", "A user with this email already exists.");
        }

        User doc = new User();
        doc.setFullName(name);
        doc.setSpecialization(spec);
        doc.setEmail(email);
        
        // Securely hash their password using BCrypt
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = 
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        doc.setPassword(encoder.encode(password));
        
        doc.setRole("doctor");
        doc.setDoctorStatus("OFFLINE");
        doc.setRating(5.0); // Start with a default 5-star rating
        doc.setReviewCount(1);
        
        userRepository.save(doc);

        return Map.of(
            "status", "success", 
            "message", "Dr. " + name + " has been added to PulseSync!"
        );
    }
}