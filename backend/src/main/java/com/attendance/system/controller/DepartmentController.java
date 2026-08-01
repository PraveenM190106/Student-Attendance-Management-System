package com.attendance.system.controller;

import com.attendance.system.dto.AssignmentRequest;
import com.attendance.system.dto.GradeSubmissionRequest;
import com.attendance.system.entity.*;
import com.attendance.system.repository.*;
import com.attendance.system.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/department")
public class DepartmentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private WeeklyAttendanceHistoryRepository weeklyAttendanceHistoryRepository;

    @GetMapping("/students")
    public ResponseEntity<List<User>> getDepartmentStudents(@RequestParam("department") String department) {
        return ResponseEntity.ok(userRepository.findByDepartmentAndRoleAndStatus(department, "ROLE_STUDENT", "APPROVED"));
    }

    @GetMapping("/pending-students")
    public ResponseEntity<List<User>> getDepartmentPendingStudents(@RequestParam("department") String department) {
        return ResponseEntity.ok(userRepository.findByDepartmentAndRoleAndStatus(department, "ROLE_STUDENT", "PENDING"));
    }

    @PostMapping("/students/{id}/approve")
    public ResponseEntity<?> approveStudent(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (!"ROLE_STUDENT".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is not a student."));
        }
        user.setStatus("APPROVED");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Student approved successfully", "user", user));
    }

    @PostMapping("/students/{id}/reject")
    public ResponseEntity<?> rejectStudent(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (!"ROLE_STUDENT".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is not a student."));
        }
        user.setStatus("REJECTED");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Student registration rejected", "user", user));
    }

    @GetMapping("/attendance-records")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceRecords(
            @RequestParam("department") String department,
            @RequestParam(value = "workingDay", required = false) String workingDay,
            @RequestParam(value = "weekNumber", required = false) Integer weekNumber) {
        if (workingDay != null && !workingDay.trim().isEmpty() && weekNumber != null) {
            return ResponseEntity.ok(attendanceRecordRepository.findByDepartmentAndWeekNumberAndWorkingDay(department, weekNumber, workingDay));
        } else if (workingDay != null && !workingDay.trim().isEmpty()) {
            return ResponseEntity.ok(attendanceRecordRepository.findByDepartmentAndWorkingDay(department, workingDay));
        } else if (weekNumber != null) {
            return ResponseEntity.ok(attendanceRecordRepository.findByDepartmentAndWeekNumber(department, weekNumber));
        }
        return ResponseEntity.ok(attendanceRecordRepository.findByDepartment(department));
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequests(@RequestParam("department") String department) {
        return ResponseEntity.ok(leaveService.getDepartmentLeaveRequests(department));
    }

    @PostMapping("/leave-requests/{id}/approve")
    public ResponseEntity<?> approveLeave(@PathVariable("id") Long id, @RequestParam("staffName") String staffName) {
        LeaveRequest approved = leaveService.approveLeave(id, staffName);
        return ResponseEntity.ok(Map.of("message", "Leave approved and letter generated successfully", "leave", approved));
    }

    @PostMapping("/leave-requests/{id}/reject")
    public ResponseEntity<?> rejectLeave(@PathVariable("id") Long id, @RequestParam("staffName") String staffName) {
        LeaveRequest rejected = leaveService.rejectLeave(id, staffName);
        return ResponseEntity.ok(Map.of("message", "Leave request rejected", "leave", rejected));
    }

    // Assignment CRUD
    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getAssignments(@RequestParam("department") String department) {
        return ResponseEntity.ok(assignmentRepository.findByDepartment(department));
    }

    @PostMapping("/assignments")
    public ResponseEntity<?> createAssignment(@RequestBody AssignmentRequest request, Principal principal) {
        String staffEmail = principal != null ? principal.getName() : "Faculty Staff";
        Assignment assignment = Assignment.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .department(request.getDepartment())
                .dueDate(request.getDueDate())
                .createdBy(staffEmail)
                .build();

        assignmentRepository.save(assignment);
        return ResponseEntity.ok(Map.of("message", "Assignment created successfully", "assignment", assignment));
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable("id") Long id, @RequestBody AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (request.getTitle() != null) assignment.setTitle(request.getTitle());
        if (request.getDescription() != null) assignment.setDescription(request.getDescription());
        if (request.getDueDate() != null) assignment.setDueDate(request.getDueDate());

        assignmentRepository.save(assignment);
        return ResponseEntity.ok(Map.of("message", "Assignment updated successfully", "assignment", assignment));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable("id") Long id) {
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(@PathVariable("assignmentId") Long assignmentId) {
        return ResponseEntity.ok(submissionRepository.findByAssignmentId(assignmentId));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(@PathVariable("submissionId") Long submissionId, @RequestBody GradeSubmissionRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());

        submissionRepository.save(submission);
        return ResponseEntity.ok(Map.of("message", "Submission graded successfully", "submission", submission));
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getDepartmentAnalytics(@RequestParam("department") String department) {
        Integer maxCompletedWeek = weeklyAttendanceHistoryRepository.findMaxCompletedWeekNumber();
        Integer currentActiveWeek = maxCompletedWeek + 1;

        // Charts & current week stats display only active week's records
        List<AttendanceRecord> records = attendanceRecordRepository.findByDepartmentAndWeekNumber(department, currentActiveWeek);
        List<User> students = userRepository.findByDepartmentAndRoleAndStatus(department, "ROLE_STUDENT", "APPROVED");
        List<WeeklyAttendanceHistory> weeklyHistory = weeklyAttendanceHistoryRepository.findByDepartmentOrderByWeekNumberAsc(department);

        long totalClasses = records.size();
        long presentCount = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
        long absentCount = records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();

        double overallPercentage = totalClasses > 0 ? (presentCount * 100.0) / totalClasses : 0.0;

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

        List<Map<String, Object>> weeklyStats = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : weeklyGroupMap.entrySet()) {
            String day = entry.getKey();
            long wPresent = entry.getValue().get("present");
            long wAbsent = entry.getValue().get("absent");
            long wTotal = entry.getValue().get("total");
            double wPct = wTotal > 0 ? Math.round((wPresent * 100.0 / wTotal) * 100.0) / 100.0 : 0.0;

            weeklyStats.add(Map.of(
                    "day", day,
                    "present", wPresent,
                    "absent", wAbsent,
                    "total", wTotal,
                    "percentage", wPct
            ));
        }

        List<Map<String, Object>> monthlyStats = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> entry : monthlyGroupMap.entrySet()) {
            String month = entry.getKey();
            long mPresent = entry.getValue().get("present");
            long mAbsent = entry.getValue().get("absent");
            long mTotal = entry.getValue().get("total");
            double mPct = mTotal > 0 ? Math.round((mPresent * 100.0 / mTotal) * 100.0) / 100.0 : 0.0;

            monthlyStats.add(Map.of(
                    "month", month,
                    "present", mPresent,
                    "absent", mAbsent,
                    "total", mTotal,
                    "percentage", mPct
            ));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("currentWeekNumber", currentActiveWeek);
        result.put("totalStudents", students.size());
        result.put("totalClasses", totalClasses);
        result.put("presentCount", presentCount);
        result.put("absentCount", absentCount);
        result.put("overallPercentage", Math.round(overallPercentage * 100.0) / 100.0);
        result.put("weeklyStats", weeklyStats);
        result.put("monthlyStats", monthlyStats);
        result.put("weeklyHistory", weeklyHistory);

        return ResponseEntity.ok(result);
    }
}
