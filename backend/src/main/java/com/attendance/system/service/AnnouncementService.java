package com.attendance.system.service;

import com.attendance.system.entity.Announcement;
import com.attendance.system.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    public Announcement createAnnouncement(Announcement announcement) {
        if (announcement.getDate() == null || announcement.getDate().trim().isEmpty()) {
            announcement.setDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
        }
        if (announcement.getDepartment() == null || announcement.getDepartment().trim().isEmpty()) {
            announcement.setDepartment("ALL");
        }
        return announcementRepository.save(announcement);
    }

    public List<Announcement> getAnnouncementsByDepartment(String department) {
        if (department == null || department.trim().isEmpty() || "ALL".equalsIgnoreCase(department)) {
            return announcementRepository.findAllByOrderByCreatedAtDesc();
        }
        return announcementRepository.findByDepartmentInOrderByCreatedAtDesc(Arrays.asList(department, "ALL"));
    }

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }
}
