package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDTO {
    private Long id;
    private String rollNumber;
    private String name;
    private String email;
    private String department;
    private Integer semester;
    private String phone;
    private String status;
    private Double attendancePercentage;
}
