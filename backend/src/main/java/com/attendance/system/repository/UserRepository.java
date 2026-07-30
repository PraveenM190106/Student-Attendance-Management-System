package com.attendance.system.repository;

import com.attendance.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleAndStatus(String role, String status);
    List<User> findByRole(String role);
    List<User> findByDepartmentAndRoleAndStatus(String department, String role, String status);
    List<User> findByDepartmentAndRole(String department, String role);
}
