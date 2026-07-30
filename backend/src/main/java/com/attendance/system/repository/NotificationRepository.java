package com.attendance.system.repository;

import com.attendance.system.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId OR n.targetRole = 'ALL' OR n.targetRole = :role ORDER BY n.id DESC")
    List<Notification> findForUser(Long userId, String role);
}
