package com.attendance.system.controller;

import com.attendance.system.dto.*;
import com.attendance.system.entity.*;
import com.attendance.system.repository.*;
import com.attendance.system.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private FaceVerificationService faceVerificationService;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnnouncementService announcementService;

    @PostMapping("/verify-face")
    public ResponseEntity<?> verifyFace(@RequestParam("studentId") Long studentId, @RequestBody FaceVerificationRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getProfileImage() == null || student.getProfileImage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No profile image registered for face verification."));
        }

        FaceVerificationService.VerificationResult result = faceVerificationService.verifyFace(
                student.getProfileImage(),
                request.getCapturedImage()
        );

        return ResponseEntity.ok(Map.of(
                "success", result.isSuccess(),
                "message", result.getMessage()
        ));
    }

    @PostMapping("/mark-attendance")
    public ResponseEntity<?> markAttendance(
            @RequestParam("studentId") Long studentId,
            @RequestParam("status") String status,
            @RequestParam(value = "sessionId", required = false) Long sessionId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        AttendanceRecord record = attendanceService.markStudentAttendance(student, status, sessionId);
        return ResponseEntity.ok(Map.of("message", "Attendance saved successfully", "record", record));
    }

    @PostMapping("/apply-leave")
    public ResponseEntity<?> applyLeave(@RequestParam("studentId") Long studentId, @RequestBody LeaveApplicationRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        LeaveRequest leaveRequest = leaveService.applyLeave(student, request.getReason());
        return ResponseEntity.ok(Map.of("message", "Leave application submitted successfully", "leave", leaveRequest));
    }

    @GetMapping("/leave-requests")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequests(@RequestParam("studentId") Long studentId) {
        return ResponseEntity.ok(leaveService.getStudentLeaveRequests(studentId));
    }

    @GetMapping("/assignments")
    public ResponseEntity<List<Assignment>> getAssignments(@RequestParam("department") String department) {
        return ResponseEntity.ok(assignmentRepository.findByDepartment(department));
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> submitAssignment(
            @PathVariable("assignmentId") Long assignmentId,
            @RequestParam("studentId") Long studentId,
            @RequestBody Map<String, String> payload) {

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String submissionText = payload.getOrDefault("submissionText", "");

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(AssignmentSubmission.builder()
                        .assignmentId(assignmentId)
                        .studentId(studentId)
                        .studentName(student.getFullName())
                        .rollNumber(student.getRollNumber())
                        .build());

        submission.setSubmissionText(submissionText);
        submissionRepository.save(submission);

        return ResponseEntity.ok(Map.of("message", "Assignment submitted successfully", "submission", submission));
    }

    @GetMapping("/assignments/my-submissions")
    public ResponseEntity<List<AssignmentSubmission>> getMySubmissions(@RequestParam("studentId") Long studentId) {
        return ResponseEntity.ok(submissionRepository.findByStudentId(studentId));
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@RequestParam("studentId") Long studentId) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceAnalytics(studentId));
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(
            @RequestParam("studentId") Long studentId,
            @RequestParam(value = "department", required = false) String department) {
        User student = userRepository.findById(studentId).orElse(null);
        String dept = (department != null && !department.trim().isEmpty()) ? department : (student != null ? student.getDepartment() : "ALL");

        List<Announcement> announcements = announcementService.getAnnouncementsByDepartment(dept);
        List<Notification> sysNotifications = notificationRepository.findForUser(studentId, "ROLE_STUDENT");

        // Convert existing Notifications into Announcement view format if any exist
        List<Announcement> resultList = new java.util.ArrayList<>(announcements);
        for (Notification n : sysNotifications) {
            boolean exists = resultList.stream().anyMatch(a -> a.getTitle().equals(n.getTitle()) && a.getMessage().equals(n.getMessage()));
            if (!exists) {
                resultList.add(Announcement.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .date(n.getCreatedAt() != null ? n.getCreatedAt().toLocalDate().toString() : "System Alert")
                        .department("SYSTEM")
                        .createdBy("Administrator")
                        .build());
            }
        }

        return ResponseEntity.ok(resultList);
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getStudentAnnouncements(@RequestParam(value = "department", required = false) String department) {
        return ResponseEntity.ok(announcementService.getAnnouncementsByDepartment(department != null ? department : "ALL"));
    }
}
