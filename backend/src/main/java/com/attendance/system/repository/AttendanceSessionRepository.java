package com.attendance.system.repository;

import com.attendance.system.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.isActive = true AND s.endTime > :now ORDER BY s.id DESC LIMIT 1")
    Optional<AttendanceSession> findActiveSession(LocalDateTime now);
    
    Optional<AttendanceSession> findFirstByIsActiveTrueOrderByIdDesc();

    @Query("SELECT COALESCE(MAX(s.weekNumber), 1) FROM AttendanceSession s")
    Integer findMaxWeekNumber();
}
