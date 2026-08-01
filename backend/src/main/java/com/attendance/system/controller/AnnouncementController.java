package com.attendance.system.controller;

import com.attendance.system.entity.Announcement;
import com.attendance.system.service.AnnouncementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<?> createAnnouncement(@RequestBody Announcement announcement) {
        if (announcement.getTitle() == null || announcement.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        }
        if (announcement.getMessage() == null || announcement.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message is required"));
        }

        Announcement saved = announcementService.createAnnouncement(announcement);
        return ResponseEntity.ok(Map.of(
                "message", "Announcement created successfully",
                "announcement", saved
        ));
    }

    @GetMapping
    public ResponseEntity<List<Announcement>> getAnnouncements(@RequestParam(value = "department", required = false) String department) {
        if (department != null && !department.trim().isEmpty()) {
            return ResponseEntity.ok(announcementService.getAnnouncementsByDepartment(department));
        }
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }
}
