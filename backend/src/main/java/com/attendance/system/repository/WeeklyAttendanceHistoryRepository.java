package com.attendance.system.repository;

import com.attendance.system.entity.WeeklyAttendanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyAttendanceHistoryRepository extends JpaRepository<WeeklyAttendanceHistory, Long> {
    List<WeeklyAttendanceHistory> findByDepartmentOrderByWeekNumberAsc(String department);
    Optional<WeeklyAttendanceHistory> findByDepartmentAndWeekNumber(String department, Integer weekNumber);

    @Query("SELECT COALESCE(MAX(w.weekNumber), 0) FROM WeeklyAttendanceHistory w")
    Integer findMaxCompletedWeekNumber();
}
