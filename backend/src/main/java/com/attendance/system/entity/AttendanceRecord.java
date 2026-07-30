package com.attendance.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "roll_number", nullable = false)
    private String rollNumber;

    @Column(nullable = false)
    private String department;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "working_day")
    private String workingDay;

    @Column(name = "week_number")
    @Builder.Default
    private Integer weekNumber = 1;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private String status; // PRESENT, ABSENT

    @Column(name = "verification_method")
    private String verificationMethod = "FACE_RECOGNITION";

    private String remarks;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
