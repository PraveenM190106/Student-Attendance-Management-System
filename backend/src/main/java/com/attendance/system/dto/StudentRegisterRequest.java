package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRegisterRequest {
    private String fullName;
    private String rollNumber;
    private String department;
    private String email;
    private String password;
    private String confirmPassword;
    private String profileImage; // Base64 string
}
