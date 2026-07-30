package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRegisterRequest {
    private String staffName;
    private String staffId;
    private String department;
    private String email;
    private String password;
}
