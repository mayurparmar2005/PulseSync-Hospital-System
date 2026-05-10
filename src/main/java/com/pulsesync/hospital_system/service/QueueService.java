package com.pulsesync.hospital_system.service;

import com.pulsesync.hospital_system.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class QueueService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // DSA: Thread-safe map to store daily token counters per doctor
    private final ConcurrentHashMap<String, AtomicInteger> dailyTokens = new ConcurrentHashMap<>();
    private String currentDate = LocalDate.now().toString();

    /**
     * O(1) Atomic operation to get the absolute next token for a doctor.
     * Prevents race conditions if two receptionists book at the exact same millisecond.
     */
    public int getNextToken(String doctorName) {
        String today = LocalDate.now().toString();

        // If the date changes at midnight, flush the hashmap to reset tokens to #1 for the new day
        if (!today.equals(currentDate)) {
            dailyTokens.clear();
            currentDate = today;
        }

        // Compute if absent: If the server restarted, fetch the highest token from DB to resume correctly
        dailyTokens.computeIfAbsent(doctorName, doc -> {
            long currentDbCount = appointmentRepository.countByDoctorNameAndDate(doc, today);
            return new AtomicInteger((int) currentDbCount);
        });

        // Atomically increment and return (100% thread-safe)
        return dailyTokens.get(doctorName).incrementAndGet();
    }

    /**
     * Analytics: Get total patients seen by a doctor today
     */
    public int getTodayPatientCount(String doctorName) {
        if (dailyTokens.containsKey(doctorName)) {
            return dailyTokens.get(doctorName).get();
        }
        return 0;
    }
}