package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private Long courseId;
    private String courseName;
    private LocalDate attendanceDate;
    private String status; // PRESENT, ABSENT, LATE
    private String remarks;
    private String markedBy;
}
