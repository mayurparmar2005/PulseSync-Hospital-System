package com.pulsesync.hospital_system.controller;

import com.pulsesync.hospital_system.entity.Appointment;
import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.AppointmentRepository;
import com.pulsesync.hospital_system.repository.UserRepository;
import com.pulsesync.hospital_system.service.QueueService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    
    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QueueService queueService;

    // --- 1. BOOK APPOINTMENT (Receptionist) ---
    @PostMapping("/book")
    public Map<String, Object> bookAppointment(@RequestBody Map<String, String> data) {
        String name     = data.get("name");
        String mobile   = data.get("mobile");
        String doctor   = data.get("doctor");
        String symptoms = data.get("symptoms");
        String spec     = data.get("doctorSpecialization"); // sent from reception
        // Count tokens PER DOCTOR per day (not globally)
        int nextToken = queueService.getNextToken(doctor);

        Appointment newAppt = new Appointment(name, mobile, doctor, symptoms, nextToken);

        // Store specialization so patient dashboard can display it without a join
        if (spec != null && !spec.isEmpty()) {
            newAppt.setDoctorSpecialization(spec);
        } else {
            // Fallback: look up from DB
            User doc = userRepository.findAll().stream()
                .filter(u -> doctor.equals(u.getFullName()))
                .findFirst().orElse(null);
            if (doc != null) newAppt.setDoctorSpecialization(doc.getSpecialization());
        }

        appointmentRepository.save(newAppt);

        return Map.of(
            "status",  "success",
            "token",   nextToken,
            "doctor",  doctor,
            "message", "Booked for " + doctor + " (Token #" + nextToken + ")"
        );
    }

    // --- 2. GET LIVE QUEUE for a specific doctor ---
    @GetMapping("/live")
    public List<Appointment> getLiveQueue(@RequestParam(required = false) String doctor) {
        List<Appointment> all      = appointmentRepository.findAll();
        List<Appointment> filtered = new ArrayList<>();

        for (Appointment app : all) {
            // Safety fix: if queueIndex is 0 (old data), set it from tokenNumber
            if (app.getQueueIndex() == 0) {
                app.setQueueIndex(app.getTokenNumber());
                appointmentRepository.save(app);
            }

            // Filter by WAITING status and optionally by doctor name
            if ("WAITING".equals(app.getStatus()) &&
               (doctor == null || app.getDoctorName().equalsIgnoreCase(doctor))) {
                filtered.add(app);
            }
        }

        // Sort by queueIndex so swaps are reflected in correct order
        filtered.sort(Comparator.comparingInt(Appointment::getQueueIndex));
        return filtered;
    }

    // --- 3. GET MY APPOINTMENTS (Patient Dashboard) ---
    // FIX #6: New endpoint so the patient dashboard can show real live data
    @GetMapping("/mine")
    public List<Appointment> getMyAppointments(@RequestParam String mobile) {
        List<Appointment> all = appointmentRepository.findByPatientMobile(mobile);
        // Return today's appointments first, then historical
        String today = LocalDate.now().toString();
        all.sort((a, b) -> {
            boolean aToday = today.equals(a.getDate());
            boolean bToday = today.equals(b.getDate());
            if (aToday && !bToday) return -1;
            if (!aToday && bToday) return 1;
            return Integer.compare(a.getTokenNumber(), b.getTokenNumber());
        });
        return all;
    }

    // --- 4. MARK COMPLETED (Doctor Action — doctor-aware + saves prescription) ---
    @PostMapping("/complete/{token}")
    public Map<String, Object> completeAppointment(
            @PathVariable int token,
            @RequestBody(required = false) Map<String, String> data) {

        String doctorName   = (data != null) ? data.get("doctorName")   : null;
        String prescription = (data != null) ? data.get("prescription") : null;

        // Use doctor-aware search if doctorName is provided
        List<Appointment> apps = (doctorName != null && !doctorName.isEmpty())
            ? appointmentRepository.findByDoctorNameAndStatus(doctorName, "WAITING")
            : appointmentRepository.findByStatus("WAITING");

        for (Appointment app : apps) {
            if (app.getTokenNumber() == token) {
                app.setStatus("COMPLETED");
                if (prescription != null && !prescription.trim().isEmpty()) {
                    app.setPrescription(prescription);
                }
                appointmentRepository.save(app);
                return Map.of("status", "success", "message", "Patient #" + token + " Completed.");
            }
        }
        return Map.of("status", "error", "message", "Token not found.");
    }

    // --- 5. NOTIFY / CALL PATIENT ---
    @PostMapping("/notify/{token}")
    public Map<String, Object> notifyPatient(@PathVariable int token) {
        List<Appointment> queue = getLiveQueue(null);
        for (Appointment app : queue) {
            if (app.getTokenNumber() == token) {
                return Map.of(
                    "status",  "success",
                    "message", "📢 Alert sent to " + app.getPatientName() + ": 'Please enter the room!'"
                );
            }
        }
        return Map.of("status", "error", "message", "Patient not found.");
    }

    // --- 6. SMART NUDGE: SWAP (move patient 1 step back in their doctor's queue) ---
    @PostMapping("/swap/{token}")
    public Map<String, Object> swapPatient(@PathVariable int token) {

        // A. Find the appointment to determine the doctor
        Appointment currentAppt = appointmentRepository.findAll().stream()
                .filter(a -> a.getTokenNumber() == token && "WAITING".equals(a.getStatus()))
                .findFirst()
                .orElse(null);

        if (currentAppt == null) {
            return Map.of("status", "error", "message", "Token not found.");
        }

        // B. Get the live queue ONLY for this specific doctor
        String doctorName = currentAppt.getDoctorName();
        List<Appointment> doctorQueue = getLiveQueue(doctorName);

        // C. Find the current patient and the next patient in their doctor's queue
        Appointment current = null;
        Appointment next    = null;
        int currentIndex    = -1;

        for (int i = 0; i < doctorQueue.size(); i++) {
            if (doctorQueue.get(i).getTokenNumber() == token) {
                current      = doctorQueue.get(i);
                currentIndex = i;
                break;
            }
        }

        // D. Swap their queueIndex values (push current 1 position back)
        if (current != null && currentIndex + 1 < doctorQueue.size()) {
            next = doctorQueue.get(currentIndex + 1);

            System.out.println("🔀 Swapping " + current.getPatientName() + " with " + next.getPatientName());

            int indexA = current.getQueueIndex();
            int indexB = next.getQueueIndex();

            // Safety: if indices are identical (e.g. old data both 0), force them apart
            if (indexA == indexB) {
                indexA = currentIndex;
                indexB = currentIndex + 1;
            }

            current.setQueueIndex(indexB);
            next.setQueueIndex(indexA);

            appointmentRepository.save(current);
            appointmentRepository.save(next);

            return Map.of("status", "success", "message", "Swapped positions.");
        }

        return Map.of("status", "error", "message", "Nobody next to swap with!");
    }
}