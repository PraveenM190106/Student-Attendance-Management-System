package com.attendance.system.repository;

import com.attendance.system.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByDepartmentOrderByCreatedAtDesc(String department);

    List<Announcement> findByDepartmentInOrderByCreatedAtDesc(List<String> departments);

    List<Announcement> findAllByOrderByCreatedAtDesc();
}
