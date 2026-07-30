package com.attendance.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_attendance_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyAttendanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(nullable = false)
    private String department;

    @Column(name = "total_logs", nullable = false)
    private Long totalLogs;

    @Column(name = "present_count", nullable = false)
    private Long presentCount;

    @Column(name = "absent_count", nullable = false)
    private Long absentCount;

    @Column(name = "attendance_percentage", nullable = false)
    private Double attendancePercentage;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
