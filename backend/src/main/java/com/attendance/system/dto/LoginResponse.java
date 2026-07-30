package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String status;
    private String rollNumber;
    private String staffId;
    private String department;
    private String profileImage;
    private String message;
}
