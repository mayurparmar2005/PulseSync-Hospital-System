package com.pulsesync.hospital_system.repository;

import com.pulsesync.hospital_system.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    
    // 1. Find by Email (e.g. "anjali@pulse.com")
    User findByEmail(String email);

    // 2. Find by Mobile (e.g. "9876543210")
    User findByMobile(String mobile);
    
}