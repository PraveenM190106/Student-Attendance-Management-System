package com.attendance.system.repository;

import com.attendance.system.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByStudentId(Long studentId);
    List<AttendanceRecord> findByDepartment(String department);
    Optional<AttendanceRecord> findByStudentIdAndAttendanceDate(Long studentId, LocalDate attendanceDate);
    Optional<AttendanceRecord> findByStudentIdAndSessionId(Long studentId, Long sessionId);
    Optional<AttendanceRecord> findByStudentIdAndWeekNumberAndWorkingDay(Long studentId, Integer weekNumber, String workingDay);
    List<AttendanceRecord> findByDepartmentAndWorkingDay(String department, String workingDay);
    List<AttendanceRecord> findByDepartmentAndWeekNumber(String department, Integer weekNumber);
    List<AttendanceRecord> findByDepartmentAndWeekNumberAndWorkingDay(String department, Integer weekNumber, String workingDay);
    List<AttendanceRecord> findByAttendanceDate(LocalDate attendanceDate);
    long countByStudentIdAndStatus(Long studentId, String status);
    long countByStudentId(Long studentId);
}
