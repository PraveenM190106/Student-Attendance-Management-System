package com.attendance.system.repository;

import com.attendance.system.entity.CareerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface CareerProfileRepository extends JpaRepository<CareerProfile, Long> {
    Optional<CareerProfile> findByStudentId(Long studentId);

    @Transactional
    void deleteByStudentId(Long studentId);
}
