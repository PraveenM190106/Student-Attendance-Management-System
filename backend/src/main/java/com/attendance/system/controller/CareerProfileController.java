package com.attendance.system.controller;

import com.attendance.system.dto.CareerProfileDTO;
import com.attendance.system.entity.CareerProfile;
import com.attendance.system.repository.CareerProfileRepository;
import com.attendance.system.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class CareerProfileController {

    @Autowired
    private CareerProfileRepository careerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper to get or create CareerProfile for student
    private CareerProfile getOrCreateProfile(Long studentId) {
        return careerProfileRepository.findByStudentId(studentId)
                .orElseGet(() -> CareerProfile.builder()
                        .studentId(studentId)
                        .build());
    }

    // Convert entity to lightweight DTO
    private CareerProfileDTO toDTO(CareerProfile profile) {
        boolean hasResume = profile.getResumeData() != null && profile.getResumeData().length > 0;
        return CareerProfileDTO.builder()
                .studentId(profile.getStudentId())
                .hasResume(hasResume)
                .resumeFileName(profile.getResumeFileName())
                .linkedin(profile.getLinkedin())
                .github(profile.getGithub())
                .portfolio(profile.getPortfolio())
                .leetcode(profile.getLeetcode())
                .codechef(profile.getCodechef())
                .hackerrank(profile.getHackerrank())
                .build();
    }

    // ==========================================
    // STUDENT ENDPOINTS
    // ==========================================

    @GetMapping("/student/career-profile")
    public ResponseEntity<?> getStudentCareerProfile(@RequestParam("studentId") Long studentId) {
        CareerProfile profile = getOrCreateProfile(studentId);
        return ResponseEntity.ok(toDTO(profile));
    }

    @PostMapping("/student/career-profile/resume")
    public ResponseEntity<?> uploadResume(
            @RequestParam("studentId") Long studentId,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please select a valid PDF file to upload."));
        }

        // 1. Validate PDF extension & content type
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        boolean isPdf = (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf"))
                || (contentType != null && contentType.toLowerCase().contains("pdf"));

        if (!isPdf) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PDF files are allowed."));
        }

        // 2. Validate max file size: 2 MB (2 * 1024 * 1024 bytes)
        long maxSize = 2 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            return ResponseEntity.badRequest().body(Map.of("message", "File size exceeds maximum limit of 2 MB."));
        }

        // 3. Single resume restriction: check if resume already exists
        CareerProfile profile = getOrCreateProfile(studentId);
        if (profile.getResumeData() != null && profile.getResumeData().length > 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Resume already exists. Please delete your existing resume before uploading a new one."));
        }

        try {
            profile.setResumeFileName(originalFilename);
            profile.setResumeData(file.getBytes());
            profile.setResumeFileType("application/pdf");
            careerProfileRepository.save(profile);

            return ResponseEntity.ok(Map.of(
                    "message", "Resume uploaded successfully!",
                    "profile", toDTO(profile)
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to process resume file upload: " + e.getMessage()));
        }
    }

    @GetMapping("/student/career-profile/resume/download")
    public ResponseEntity<?> downloadResume(@RequestParam("studentId") Long studentId) {
        Optional<CareerProfile> profileOpt = careerProfileRepository.findByStudentId(studentId);
        if (profileOpt.isEmpty() || profileOpt.get().getResumeData() == null || profileOpt.get().getResumeData().length == 0) {
            return ResponseEntity.notFound().build();
        }

        CareerProfile profile = profileOpt.get();
        String fileName = profile.getResumeFileName() != null ? profile.getResumeFileName() : "resume.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(profile.getResumeData());
    }

    @DeleteMapping("/student/career-profile/resume")
    public ResponseEntity<?> deleteResume(@RequestParam("studentId") Long studentId) {
        Optional<CareerProfile> profileOpt = careerProfileRepository.findByStudentId(studentId);
        if (profileOpt.isPresent()) {
            CareerProfile profile = profileOpt.get();
            profile.setResumeFileName(null);
            profile.setResumeData(null);
            profile.setResumeFileType(null);
            careerProfileRepository.save(profile);
        }
        return ResponseEntity.ok(Map.of("message", "Resume deleted successfully."));
    }

    @PutMapping("/student/career-profile/links")
    public ResponseEntity<?> updateLinks(
            @RequestParam("studentId") Long studentId,
            @RequestBody CareerProfileDTO dto) {

        CareerProfile profile = getOrCreateProfile(studentId);
        profile.setLinkedin(dto.getLinkedin());
        profile.setGithub(dto.getGithub());
        profile.setPortfolio(dto.getPortfolio());
        profile.setLeetcode(dto.getLeetcode());
        profile.setCodechef(dto.getCodechef());
        profile.setHackerrank(dto.getHackerrank());

        careerProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of(
                "message", "Professional links updated successfully!",
                "profile", toDTO(profile)
        ));
    }

    // ==========================================
    // DEPARTMENT ENDPOINTS (READ-ONLY)
    // ==========================================

    @GetMapping("/department/career-profile")
    public ResponseEntity<?> getDeptStudentCareerProfile(@RequestParam("studentId") Long studentId) {
        CareerProfile profile = getOrCreateProfile(studentId);
        return ResponseEntity.ok(toDTO(profile));
    }

    @GetMapping("/department/career-profile/resume/download")
    public ResponseEntity<?> downloadDeptStudentResume(@RequestParam("studentId") Long studentId) {
        return downloadResume(studentId);
    }
}
