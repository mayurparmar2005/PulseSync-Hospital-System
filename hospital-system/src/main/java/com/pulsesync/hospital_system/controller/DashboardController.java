package com.pulsesync.hospital_system.controller;

import com.pulsesync.hospital_system.entity.Appointment;
import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.AppointmentRepository;
import com.pulsesync.hospital_system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // --- 1. GET LIVE STATUS OF ALL DOCTORS ---
    @GetMapping("/monitor")
    public List<Map<String, Object>> getLiveMonitor() {
        List<Map<String, Object>> dashboardData = new ArrayList<>();
        String today = LocalDate.now().toString();

        // Get all Doctors
        List<User> doctors = userRepository.findAll().stream()
                .filter(u -> "doctor".equals(u.getRole()))
                .collect(Collectors.toList());

        // Get all of Today's Appointments
        List<Appointment> allAppts = appointmentRepository.findAll().stream()
                .filter(a -> a.getDate() != null && a.getDate().equals(today))
                .collect(Collectors.toList());

        for (User doc : doctors) {
            Map<String, Object> stat = new HashMap<>();
            stat.put("doctorName",     doc.getFullName());
            stat.put("specialization", doc.getSpecialization());

            // FIX #10: Use the real doctorStatus field instead of hardcoded 'true'
            String status = doc.getDoctorStatus();
            stat.put("isOnline",   "AVAILABLE".equals(status));
            stat.put("doctorStatus", status != null ? status : "OFFLINE");

            // Filter appointments for THIS doctor
            List<Appointment> docAppts = allAppts.stream()
                    .filter(a -> a.getDoctorName() != null && a.getDoctorName().equals(doc.getFullName()))
                    .collect(Collectors.toList());

            // Running token = the first WAITING patient (lowest queueIndex)
            Optional<Appointment> nextPatient = docAppts.stream()
                    .filter(a -> "WAITING".equals(a.getStatus()))
                    .min(Comparator.comparingInt(Appointment::getTokenNumber));

            stat.put("runningToken",   nextPatient.map(Appointment::getTokenNumber).orElse(0));
            stat.put("waitingCount",   docAppts.stream().filter(a -> "WAITING".equals(a.getStatus())).count());
            stat.put("completedCount", docAppts.stream().filter(a -> "COMPLETED".equals(a.getStatus())).count());

            dashboardData.add(stat);
        }
        return dashboardData;
    }

    // --- 2. GET ALL PATIENT RECORDS ---
    @GetMapping("/patients")
    public List<Appointment> getAllPatients() {
        return appointmentRepository.findAll();
    }
}