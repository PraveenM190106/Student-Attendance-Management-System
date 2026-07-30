package com.attendance.system.repository;

import com.attendance.system.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStudentId(Long studentId);
    List<LeaveRequest> findByDepartment(String department);
    List<LeaveRequest> findByDepartmentAndStatus(String department, String status);
}
