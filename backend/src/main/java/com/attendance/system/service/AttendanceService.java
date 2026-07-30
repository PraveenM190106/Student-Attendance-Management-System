package com.attendance.system.service;

import com.attendance.system.entity.AttendanceRecord;
import com.attendance.system.entity.AttendanceSession;
import com.attendance.system.entity.User;
import com.attendance.system.entity.WeeklyAttendanceHistory;
import com.attendance.system.repository.AttendanceRecordRepository;
import com.attendance.system.repository.AttendanceSessionRepository;
import com.attendance.system.repository.UserRepository;
import com.attendance.system.repository.WeeklyAttendanceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    @Autowired
    private AttendanceRecordRepository recordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WeeklyAttendanceHistoryRepository weeklyAttendanceHistoryRepository;

    private boolean weekResetPending = false;

    @Transactional
    public AttendanceSession startSession(int durationMinutes, String workingDay, String adminEmail) {
        // Deactivate previous active sessions
        Optional<AttendanceSession> lastSessionOpt = sessionRepository.findFirstByIsActiveTrueOrderByIdDesc();
        Integer maxCompletedWeek = weeklyAttendanceHistoryRepository.findMaxCompletedWeekNumber();
        Integer currentWeek = maxCompletedWeek + 1;

        if (weekResetPending) {
            weekResetPending = false;
        }

        if (lastSessionOpt.isPresent()) {
            AttendanceSession lastSession = lastSessionOpt.get();
            lastSession.setIsActive(false);
            sessionRepository.save(lastSession);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = now.plusMinutes(durationMinutes);
        String day = (workingDay != null && !workingDay.trim().isEmpty()) ? workingDay : "Day 1";

        AttendanceSession newSession = AttendanceSession.builder()
                .workingDay(day)
                .weekNumber(currentWeek)
                .durationMinutes(durationMinutes)
                .startTime(now)
                .endTime(endTime)
                .createdBy(adminEmail)
                .isActive(true)
                .build();

        return sessionRepository.save(newSession);
    }

    public Map<String, Object> getActiveSessionStatus() {
        LocalDateTime now = LocalDateTime.now();
        Optional<AttendanceSession> activeOpt = sessionRepository.findActiveSession(now);

        Integer maxCompletedWeek = weeklyAttendanceHistoryRepository.findMaxCompletedWeekNumber();
        Integer currentActiveWeek = maxCompletedWeek + 1;

        Map<String, Object> result = new HashMap<>();
        if (activeOpt.isPresent()) {
            AttendanceSession session = activeOpt.get();
            long remainingSeconds = java.time.Duration.between(now, session.getEndTime()).getSeconds();
            result.put("active", true);
            result.put("sessionId", session.getId());
            result.put("workingDay", session.getWorkingDay() != null ? session.getWorkingDay() : "Day 1");
            result.put("weekNumber", session.getWeekNumber() != null ? session.getWeekNumber() : currentActiveWeek);
            result.put("durationMinutes", session.getDurationMinutes());
            result.put("startTime", session.getStartTime());
            result.put("endTime", session.getEndTime());
            result.put("remainingSeconds", Math.max(0, remainingSeconds));
        } else {
            // Check if there is an active session that just expired and process auto-absent
            Optional<AttendanceSession> lastSessionOpt = sessionRepository.findFirstByIsActiveTrueOrderByIdDesc();
            if (lastSessionOpt.isPresent() && lastSessionOpt.get().getEndTime() != null && lastSessionOpt.get().getEndTime().isBefore(now)) {
                closeSessionAndMarkAbsent(lastSessionOpt.get());
            }
            result.put("active", false);
            result.put("remainingSeconds", 0);
            result.put("workingDay", "Day 1");
            result.put("weekNumber", currentActiveWeek);
        }
        return result;
    }

    @Transactional
    public void endActiveSession() {
        sessionRepository.findFirstByIsActiveTrueOrderByIdDesc().ifPresent(this::closeSessionAndMarkAbsent);
    }

    @Transactional
    public void resetWeek() {
        endActiveSession();
        weekResetPending = true;

        Integer maxCompletedWeek = weeklyAttendanceHistoryRepository.findMaxCompletedWeekNumber();
        Integer sessionMaxWeek = sessionRepository.findMaxWeekNumber();
        int completedWeek = Math.max(maxCompletedWeek + 1, sessionMaxWeek != null ? sessionMaxWeek : 1);

        // Calculate and permanently save completed week history for each department
        Set<String> departments = new HashSet<>();
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.getDepartment() != null && !u.getDepartment().trim().isEmpty()) {
                departments.add(u.getDepartment().trim());
            }
        }
        if (departments.isEmpty()) {
            departments.add("General");
        }

        for (String dept : departments) {
            List<AttendanceRecord> weekRecords = recordRepository.findByDepartmentAndWeekNumber(dept, completedWeek);
            long totalLogs = weekRecords.size();
            long presentCount = weekRecords.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
            long absentCount = weekRecords.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();
            double pct = totalLogs > 0 ? Math.round((presentCount * 100.0 / totalLogs) * 100.0) / 100.0 : 0.0;

            LocalDate startDate = weekRecords.stream().map(AttendanceRecord::getAttendanceDate).filter(Objects::nonNull).min(LocalDate::compareTo).orElse(LocalDate.now());
            LocalDate endDate = weekRecords.stream().map(AttendanceRecord::getAttendanceDate).filter(Objects::nonNull).max(LocalDate::compareTo).orElse(LocalDate.now());

            Optional<WeeklyAttendanceHistory> existingHistory = weeklyAttendanceHistoryRepository.findByDepartmentAndWeekNumber(dept, completedWeek);
            WeeklyAttendanceHistory history;
            if (existingHistory.isPresent()) {
                history = existingHistory.get();
                history.setTotalLogs(totalLogs);
                history.setPresentCount(presentCount);
                history.setAbsentCount(absentCount);
                history.setAttendancePercentage(pct);
                history.setStartDate(startDate);
                history.setEndDate(endDate);
            } else {
                history = WeeklyAttendanceHistory.builder()
                        .weekNumber(completedWeek)
                        .department(dept)
                        .totalLogs(totalLogs)
                        .presentCount(presentCount)
                        .absentCount(absentCount)
                        .attendancePercentage(pct)
                        .startDate(startDate)
                        .endDate(endDate)
                        .build();
            }
            weeklyAttendanceHistoryRepository.save(history);
        }
    }

    @Transactional
    public void closeSessionAndMarkAbsent(AttendanceSession session) {
        if (session == null || Boolean.FALSE.equals(session.getIsActive())) {
            return;
        }
        session.setIsActive(false);
        sessionRepository.save(session);

        // Auto-mark absent for approved students who haven't submitted attendance for this session/day
        List<User> approvedStudents = userRepository.findByRoleAndStatus("ROLE_STUDENT", "APPROVED");
        LocalDate today = session.getStartTime() != null ? session.getStartTime().toLocalDate() : LocalDate.now();
        String day = session.getWorkingDay() != null ? session.getWorkingDay() : "Day 1";
        Integer weekNum = session.getWeekNumber() != null ? session.getWeekNumber() : 1;

        for (User student : approvedStudents) {
            Optional<AttendanceRecord> existing = recordRepository.findByStudentIdAndWeekNumberAndWorkingDay(student.getId(), weekNum, day);
            if (existing.isEmpty()) {
                AttendanceRecord absentRecord = AttendanceRecord.builder()
                        .studentId(student.getId())
                        .studentName(student.getFullName())
                        .rollNumber(student.getRollNumber() != null ? student.getRollNumber() : "N/A")
                        .department(student.getDepartment() != null ? student.getDepartment() : "General")
                        .sessionId(session.getId())
                        .workingDay(day)
                        .weekNumber(weekNum)
                        .attendanceDate(today)
                        .status("ABSENT")
                        .verificationMethod("AUTO_EXPIRED")
                        .remarks("Automated absent - Session expired for " + day)
                        .build();
                recordRepository.save(absentRecord);
            }
        }
    }

    @Transactional
    public AttendanceRecord markStudentAttendance(User student, String status, Long sessionId) {
        LocalDate today = LocalDate.now();

        String workingDay = "Day 1";
        Integer weekNumber = 1;
        Long activeSessionId = sessionId;

        if (sessionId != null) {
            Optional<AttendanceSession> sessionOpt = sessionRepository.findById(sessionId);
            if (sessionOpt.isPresent()) {
                AttendanceSession s = sessionOpt.get();
                if (s.getWorkingDay() != null) workingDay = s.getWorkingDay();
                if (s.getWeekNumber() != null) weekNumber = s.getWeekNumber();
            }
        } else {
            Optional<AttendanceSession> activeOpt = sessionRepository.findActiveSession(LocalDateTime.now());
            if (activeOpt.isPresent()) {
                AttendanceSession s = activeOpt.get();
                activeSessionId = s.getId();
                if (s.getWorkingDay() != null) workingDay = s.getWorkingDay();
                if (s.getWeekNumber() != null) weekNumber = s.getWeekNumber();
            }
        }

        Optional<AttendanceRecord> existing = recordRepository.findByStudentIdAndWeekNumberAndWorkingDay(student.getId(), weekNumber, workingDay);
        if (existing.isPresent()) {
            AttendanceRecord record = existing.get();
            record.setStatus(status);
            record.setWorkingDay(workingDay);
            record.setWeekNumber(weekNumber);
            if (activeSessionId != null) record.setSessionId(activeSessionId);
            record.setRemarks(status.equalsIgnoreCase("PRESENT") ? "Face Verified - Present (" + workingDay + ")" : "Marked Absent (" + workingDay + ")");
            return recordRepository.save(record);
        }

        AttendanceRecord newRecord = AttendanceRecord.builder()
                .studentId(student.getId())
                .studentName(student.getFullName())
                .rollNumber(student.getRollNumber())
                .department(student.getDepartment())
                .sessionId(activeSessionId)
                .workingDay(workingDay)
                .weekNumber(weekNumber)
                .attendanceDate(today)
                .status(status)
                .verificationMethod("FACE_RECOGNITION")
                .remarks(status.equalsIgnoreCase("PRESENT") ? "Face Verified - Present (" + workingDay + ")" : "Marked Absent (" + workingDay + ")")
                .build();

        return recordRepository.save(newRecord);
    }

    public Map<String, Object> getStudentAttendanceAnalytics(Long studentId) {
        List<AttendanceRecord> records = recordRepository.findByStudentId(studentId);
        long totalClasses = records.size();
        long presentCount = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
        long absentCount = records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();

        double percentage = totalClasses > 0 ? (presentCount * 100.0) / totalClasses : 0.0;

        // Weekly breakdown (Day 1 - Day 6)
        Map<String, Map<String, Long>> weeklyGroupMap = new LinkedHashMap<>();
        for (int i = 1; i <= 6; i++) {
            weeklyGroupMap.put("Day " + i, new HashMap<>(Map.of("present", 0L, "absent", 0L, "total", 0L)));
        }

        Map<String, Map<String, Long>> monthlyGroupMap = new TreeMap<>();
        for (AttendanceRecord r : records) {
            if (r.getWorkingDay() != null && weeklyGroupMap.containsKey(r.getWorkingDay())) {
                Map<String, Long> dayData = weeklyGroupMap.get(r.getWorkingDay());
                dayData.put("total", dayData.get("total") + 1);
                if ("PRESENT".equalsIgnoreCase(r.getStatus())) {
                    dayData.put("present", dayData.get("present") + 1);
                } else {
                    dayData.put("absent", dayData.get("absent") + 1);
                }
            }

            if (r.getAttendanceDate() != null) {
                String monthKey = r.getAttendanceDate().getYear() + "-" + String.format("%02d", r.getAttendanceDate().getMonthValue());
                monthlyGroupMap.putIfAbsent(monthKey, new HashMap<>(Map.of("present", 0L, "absent", 0L, "total", 0L)));
                Map<String, Long> monthData = monthlyGroupMap.get(monthKey);
                monthData.put("total", monthData.get("total") + 1);
                if ("PRESENT".equalsIgnoreCase(r.getStatus())) {
                    monthData.put("present", monthData.get("present") + 1);
                } else {
                    monthData.put("absent", monthData.get("absent") + 1);
                }
            }
        }

        List<Map<String, Object>> weeklyAttendance = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : weeklyGroupMap.entrySet()) {
            String day = entry.getKey();
            long wPresent = entry.getValue().get("present");
            long wAbsent = entry.getValue().get("absent");
            long wTotal = entry.getValue().get("total");

            weeklyAttendance.add(Map.of(
                    "day", day,
                    "present", wPresent,
                    "absent", wAbsent,
                    "total", wTotal
            ));
        }

        List<Map<String, Object>> monthlyAttendance = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : monthlyGroupMap.entrySet()) {
            String month = entry.getKey();
            long mPresent = entry.getValue().get("present");
            long mAbsent = entry.getValue().get("absent");
            long mTotal = entry.getValue().get("total");
            double mPct = mTotal > 0 ? Math.round((mPresent * 100.0 / mTotal) * 100.0) / 100.0 : 0.0;

            monthlyAttendance.add(Map.of(
                    "month", month,
                    "present", mPresent,
                    "absent", mAbsent,
                    "total", mTotal,
                    "percentage", mPct
            ));
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalClasses", totalClasses);
        analytics.put("presentCount", presentCount);
        analytics.put("absentCount", absentCount);
        analytics.put("percentage", Math.round(percentage * 100.0) / 100.0);
        analytics.put("records", records);
        analytics.put("weeklyAttendance", weeklyAttendance);
        analytics.put("monthlyAttendance", monthlyAttendance);

        return analytics;
    }
}
