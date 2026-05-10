package com.pulsesync.hospital_system.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users") // Maps to 'users' collection in MongoDB
public class User {

    @Id // MongoDB handles generating this unique String ID automatically
    private String id;

    private String fullName;
    private String email;
    private String password;
    private String role; // PATIENT, DOCTOR, ADMIN
    private String abhaId;
    private String phone;
    private String doctorStatus = "OFFLINE"; 
    private String mobile; // For Patient Login

    

    // --- CONSTRUCTORS ---
    public User() {} // Empty constructor is required

    public User(String fullName, String email, String password, String role, String abhaId, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.abhaId = abhaId;
        this.phone = phone;
    }

    // --- GETTERS AND SETTERS ---
    // (Generate these using your IDE: Right Click -> Generate -> Getters and Setters)
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAbhaId() { return abhaId; }
    public void setAbhaId(String abhaId) { this.abhaId = abhaId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    private int age;
    private String gender;

    // --- Add Getters and Setters ---
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    // --- RATING SYSTEM ---
    private double rating = 0.0; // Current average (e.g., 4.5)
    private int reviewCount = 0; // How many people rated (e.g., 100)

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    // ... inside User class ...
    
    private String specialization; // e.g. "Cardiologist", "General Physician"

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getDoctorStatus() { return doctorStatus; }
    public void setDoctorStatus(String doctorStatus) { this.doctorStatus = doctorStatus; }

   
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
}