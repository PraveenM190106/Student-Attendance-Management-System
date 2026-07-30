package com.attendance.system.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "career_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true)
    private Long studentId;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Lob
    @Column(name = "resume_data", columnDefinition = "LONGBLOB")
    private byte[] resumeData;

    @Column(name = "resume_file_type")
    private String resumeFileType;

    private String linkedin;
    private String github;
    private String portfolio;
    private String leetcode;
    private String codechef;
    private String hackerrank;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
