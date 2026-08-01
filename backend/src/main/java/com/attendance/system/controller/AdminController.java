package com.attendance.system.controller;

import com.attendance.system.dto.UpdateUserRequest;
import com.attendance.system.entity.AttendanceSession;
import com.attendance.system.entity.User;
import com.attendance.system.repository.UserRepository;
import com.attendance.system.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/pending-students")
    public ResponseEntity<List<User>> getPendingStudents() {
        // Students are now approved by their respective departments, not by Admin.
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/pending-departments")
    public ResponseEntity<List<User>> getPendingDepartments() {
        return ResponseEntity.ok(userRepository.findByRoleAndStatus("ROLE_DEPARTMENT", "PENDING"));
    }

    @GetMapping("/department-stats")
    public ResponseEntity<?> getDepartmentStats() {
        List<User> depts = userRepository.findByRole("ROLE_DEPARTMENT");
        List<User> students = userRepository.findByRole("ROLE_STUDENT");

        Map<String, Long> countsMap = students.stream()
                .filter(s -> s.getDepartment() != null && !s.getDepartment().trim().isEmpty())
                .collect(Collectors.groupingBy(User::getDepartment, Collectors.counting()));

        // Ensure all registered departments appear in the stats map
        for (User d : depts) {
            if (d.getDepartment() != null && !d.getDepartment().trim().isEmpty()) {
                countsMap.putIfAbsent(d.getDepartment(), 0L);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalDepartments", depts.size());
        response.put("totalStudents", students.size());
        response.put("departmentStudentCounts", countsMap);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("APPROVED");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User approved successfully", "user", user));
    }

    @PostMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("REJECTED");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User rejected successfully", "user", user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @RequestBody UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getRollNumber() != null) user.setRollNumber(request.getRollNumber());
        if (request.getStaffId() != null) user.setStaffId(request.getStaffId());

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User updated successfully", "user", user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Admin account cannot be deleted."));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PostMapping("/attendance-session/start")
    public ResponseEntity<?> startAttendanceSession(@RequestBody Map<String, Object> payload, Principal principal) {
        Integer durationMinutes = 60;
        if (payload.get("durationMinutes") != null) {
            durationMinutes = Integer.parseInt(payload.get("durationMinutes").toString());
        }
        String workingDay = payload.getOrDefault("workingDay", "Day 1").toString();
        String adminEmail = principal != null ? principal.getName() : "praveenbeece098@gmail.com";

        AttendanceSession session = attendanceService.startSession(durationMinutes, workingDay, adminEmail);
        return ResponseEntity.ok(Map.of(
                "message", "Attendance session started successfully for " + workingDay + " (" + durationMinutes + " mins).",
                "session", session
        ));
    }

    @PostMapping("/attendance-session/end")
    public ResponseEntity<?> endAttendanceSession() {
        attendanceService.endActiveSession();
        return ResponseEntity.ok(Map.of("message", "Attendance session ended successfully. Unsubmitted students marked ABSENT."));
    }

    @PostMapping("/attendance-session/reset-week")
    public ResponseEntity<?> resetWeek() {
        attendanceService.resetWeek();
        return ResponseEntity.ok(Map.of("message", "Weekly attendance cycle reset back to Day 1. Previous attendance history preserved."));
    }

    @GetMapping("/attendance-session/active")
    public ResponseEntity<?> getActiveAttendanceSession() {
        return ResponseEntity.ok(attendanceService.getActiveSessionStatus());
    }
}
