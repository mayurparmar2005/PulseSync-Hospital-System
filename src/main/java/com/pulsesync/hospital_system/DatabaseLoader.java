package com.pulsesync.hospital_system;

import com.pulsesync.hospital_system.entity.User;
import com.pulsesync.hospital_system.repository.AppointmentRepository;
import com.pulsesync.hospital_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DatabaseLoader(UserRepository userRepository, AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public void run(String... args) throws Exception {

         userRepository.deleteAll();
         appointmentRepository.deleteAll();

        // 1. Ensure the Master Admin exists so you can log in
        User existingAdmin = userRepository.findByEmail("admin@pulse.com");
        if (existingAdmin == null) {
            User admin = new User();
            admin.setFullName("Main Reception");
            admin.setEmail("admin@pulse.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // Securely hashed
            admin.setRole("receptionist");
            userRepository.save(admin);
            System.out.println("✅ Default Admin created: admin@pulse.com / admin123");
        } else {
            System.out.println("✅ Admin exists. Database is clean. No dummy data seeded.");
        }
        
    }
}