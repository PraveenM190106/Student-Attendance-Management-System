package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceMarkRequest {

    private Long courseId;
    private LocalDate attendanceDate;
    private String markedBy;
    private List<StudentAttendanceItem> attendanceList;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceItem {
        private Long studentId;
        private String status; // PRESENT, ABSENT, LATE
        private String remarks;
    }
}
