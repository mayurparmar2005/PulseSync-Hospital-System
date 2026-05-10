package com.pulsesync.hospital_system.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;
    
    private String patientName;
    private String patientMobile;
    private String doctorName; 
    private String symptoms;   
    private int tokenNumber;
    private String status;     // WAITING, COMPLETED
    private String date;  
    private int queueIndex;
    private String prescription;        // Saved by doctor on completion
    private String doctorSpecialization; // Stored at booking time

    // --- CONSTRUCTOR ---
    public Appointment(String patientName, String patientMobile, String doctorName, String symptoms, int tokenNumber) {
        this.patientName = patientName;
        this.patientMobile = patientMobile;
        this.doctorName = doctorName;
        this.symptoms = symptoms;
        this.tokenNumber = tokenNumber;
        this.queueIndex = tokenNumber; // Default: Order matches Token
        this.status = "WAITING";
        this.date = LocalDate.now().toString();
    }
    public Appointment() {} // Empty Constructor

    // --- GETTERS & SETTERS ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientMobile() { return patientMobile; }
    public void setPatientMobile(String patientMobile) { this.patientMobile = patientMobile; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public int getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(int tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public int getQueueIndex() { return queueIndex; }
    public void setQueueIndex(int queueIndex) { this.queueIndex = queueIndex; }

    public String getPrescription() { return prescription; }
    public void setPrescription(String prescription) { this.prescription = prescription; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }
}