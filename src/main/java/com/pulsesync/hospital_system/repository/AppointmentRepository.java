package com.pulsesync.hospital_system.repository;

import com.pulsesync.hospital_system.entity.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    
    // 1. Find all patients who are currently 'WAITING'
    List<Appointment> findByStatus(String status);

    // 2. [FIXED] Count appointments per DOCTOR per DATE (not globally)
    // This ensures each doctor's token queue starts from 1 independently
    long countByDoctorNameAndDate(String doctorName, String date);

    // 3. Get all appointments for a specific patient (by mobile number)
    // Used by Patient Dashboard to show their own queue status
    List<Appointment> findByPatientMobile(String patientMobile);

    // 4. Find WAITING appointments for a specific doctor (for doctor-aware complete)
    List<Appointment> findByDoctorNameAndStatus(String doctorName, String status);
}