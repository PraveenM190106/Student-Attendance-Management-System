package com.attendance.system.service;

import com.attendance.system.entity.AttendanceRecord;
import com.attendance.system.entity.AttendanceSession;
import com.attendance.system.entity.LeaveRequest;
import com.attendance.system.entity.User;
import com.attendance.system.repository.AttendanceRecordRepository;
import com.attendance.system.repository.AttendanceSessionRepository;
import com.attendance.system.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class LeaveService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AttendanceRecordRepository recordRepository;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    public LeaveRequest applyLeave(User student, String reason) {
        LocalDate today = LocalDate.now();

        String workingDay = "Day 1";
        Integer weekNumber = 1;

        Optional<AttendanceSession> activeOpt = sessionRepository.findActiveSession(LocalDateTime.now());
        if (activeOpt.isPresent()) {
            AttendanceSession s = activeOpt.get();
            if (s.getWorkingDay() != null) workingDay = s.getWorkingDay();
            if (s.getWeekNumber() != null) weekNumber = s.getWeekNumber();
        } else {
            Optional<AttendanceSession> lastOpt = sessionRepository.findFirstByIsActiveTrueOrderByIdDesc();
            if (lastOpt.isPresent()) {
                AttendanceSession s = lastOpt.get();
                if (s.getWorkingDay() != null) workingDay = s.getWorkingDay();
                if (s.getWeekNumber() != null) weekNumber = s.getWeekNumber();
            }
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .studentId(student.getId())
                .studentName(student.getFullName())
                .rollNumber(student.getRollNumber() != null ? student.getRollNumber() : "N/A")
                .department(student.getDepartment() != null ? student.getDepartment() : "General")
                .workingDay(workingDay)
                .weekNumber(weekNumber)
                .attendanceDate(today)
                .reason(reason)
                .status("PENDING")
                .build();

        return leaveRequestRepository.save(leaveRequest);
    }

    @Transactional
    public LeaveRequest approveLeave(Long leaveId, String staffName) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found: " + leaveId));

        request.setStatus("APPROVED");
        request.setApprovedBy(staffName);

        String letter = generateApprovedLeaveLetter(request, staffName);
        request.setLetterContent(letter);

        String day = request.getWorkingDay() != null ? request.getWorkingDay() : "Day 1";
        Integer weekNum = request.getWeekNumber() != null ? request.getWeekNumber() : 1;

        // Store attendance as ABSENT upon leave approval
        AttendanceRecord record = recordRepository.findByStudentIdAndWeekNumberAndWorkingDay(request.getStudentId(), weekNum, day)
                .orElse(AttendanceRecord.builder()
                        .studentId(request.getStudentId())
                        .studentName(request.getStudentName())
                        .rollNumber(request.getRollNumber())
                        .department(request.getDepartment())
                        .workingDay(day)
                        .weekNumber(weekNum)
                        .attendanceDate(request.getAttendanceDate())
                        .build());

        record.setStatus("ABSENT");
        record.setWorkingDay(day);
        record.setWeekNumber(weekNum);
        record.setVerificationMethod("APPROVED_LEAVE");
        record.setRemarks("Leave Approved by Faculty (" + staffName + ")");
        recordRepository.save(record);

        return leaveRequestRepository.save(request);
    }

    public LeaveRequest rejectLeave(Long leaveId, String staffName) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found: " + leaveId));

        request.setStatus("REJECTED");
        request.setApprovedBy(staffName);
        request.setLetterContent("Your leave request for " + request.getWorkingDay() + " (" + request.getAttendanceDate() + ") was rejected by department faculty (" + staffName + ").");

        return leaveRequestRepository.save(request);
    }

    private String generateApprovedLeaveLetter(LeaveRequest request, String staffName) {
        String formattedDate = request.getAttendanceDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
        return "=======================================================\n" +
               "        OFFICIAL APPROVED LEAVE CERTIFICATE           \n" +
               "=======================================================\n\n" +
               "Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")) + "\n" +
               "Department: " + request.getDepartment() + "\n\n" +
               "This is to certify that the leave application submitted by:\n" +
               "Student Name: " + request.getStudentName() + "\n" +
               "Roll Number : " + request.getRollNumber() + "\n" +
               "Working Day : " + (request.getWorkingDay() != null ? request.getWorkingDay() : "Day 1") + "\n" +
               "Leave Date  : " + formattedDate + "\n\n" +
               "Reason for Leave:\n\"" + request.getReason() + "\"\n\n" +
               "STATUS: OFFICIALLY APPROVED\n\n" +
               "Approved by Faculty: " + staffName + "\n" +
               "Authorized Signature: " + request.getDepartment() + " Department Head\n" +
               "=======================================================";
    }

    public List<LeaveRequest> getStudentLeaveRequests(Long studentId) {
        return leaveRequestRepository.findByStudentId(studentId);
    }

    public List<LeaveRequest> getDepartmentLeaveRequests(String department) {
        return leaveRequestRepository.findByDepartment(department);
    }
}
