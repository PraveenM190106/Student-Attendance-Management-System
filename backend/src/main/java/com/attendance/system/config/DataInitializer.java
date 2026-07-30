package com.attendance.system.config;

import com.attendance.system.entity.User;
import com.attendance.system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "praveenbeece098@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Praveen2006@"))
                    .fullName("System Administrator")
                    .role("ROLE_ADMIN")
                    .status("APPROVED")
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Predefined Admin Account Initialized: " + adminEmail);
        }
    }
}
