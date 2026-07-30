package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalStudents;
    private long totalCourses;
    private long totalTeachers;
    private double overallAttendanceRate;
    private long todayPresentCount;
    private long todayAbsentCount;
    private long todayLateCount;
    private Map<String, Double> departmentAttendanceRate;
    private List<RecentAttendanceRecord> recentRecords;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentAttendanceRecord {
        private String studentName;
        private String rollNumber;
        private String courseName;
        private String date;
        private String status;
    }
}
