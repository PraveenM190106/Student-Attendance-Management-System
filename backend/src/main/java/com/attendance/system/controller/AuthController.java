package com.attendance.system.controller;

import com.attendance.system.dto.*;
import com.attendance.system.entity.User;
import com.attendance.system.repository.UserRepository;
import com.attendance.system.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String email = loginRequest.getEmail() != null ? loginRequest.getEmail().trim() : "";
        String password = loginRequest.getPassword() != null ? loginRequest.getPassword() : "";

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password."));
        }

        // Check account approval status
        if ("PENDING".equalsIgnoreCase(user.getStatus())) {
            if ("ROLE_STUDENT".equalsIgnoreCase(user.getRole())) {
                String deptName = user.getDepartment() != null ? user.getDepartment() : "Department";
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Your registration is pending approval by " + deptName + " department staff."));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your account is pending Admin approval. You cannot log in yet."));
        } else if ("REJECTED".equalsIgnoreCase(user.getStatus())) {
            if ("ROLE_STUDENT".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Your account registration was rejected by your department."));
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your account registration was rejected by Admin."));
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole());

        LoginResponse response = LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .rollNumber(user.getRollNumber())
                .staffId(user.getStaffId())
                .department(user.getDepartment())
                .profileImage(user.getProfileImage())
                .message("Login successful")
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(@RequestBody StudentRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is already registered."));
        }

        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Passwords do not match."));
        }

        User student = User.builder()
                .fullName(request.getFullName())
                .rollNumber(request.getRollNumber())
                .department(request.getDepartment())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .profileImage(request.getProfileImage())
                .role("ROLE_STUDENT")
                .status("PENDING") // Pending approval by selected department
                .build();

        userRepository.save(student);

        return ResponseEntity.ok(Map.of(
                "message", "Student registered successfully! Registration request sent to " + (request.getDepartment() != null ? request.getDepartment() : "") + " Department for approval.",
                "status", "PENDING"
        ));
    }

    @PostMapping("/register/department")
    public ResponseEntity<?> registerDepartment(@RequestBody DepartmentRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is already registered."));
        }

        User deptStaff = User.builder()
                .fullName(request.getStaffName())
                .staffId(request.getStaffId())
                .department(request.getDepartment())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_DEPARTMENT")
                .status("PENDING") // Requirement 4: Pending until approved by Admin
                .build();

        userRepository.save(deptStaff);

        return ResponseEntity.ok(Map.of(
                "message", "Department staff registered successfully! Account is PENDING admin approval.",
                "status", "PENDING"
        ));
    }
}
