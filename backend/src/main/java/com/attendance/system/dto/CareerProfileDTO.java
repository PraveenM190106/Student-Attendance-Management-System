package com.attendance.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerProfileDTO {
    private Long studentId;
    private boolean hasResume;
    private String resumeFileName;
    private String linkedin;
    private String github;
    private String portfolio;
    private String leetcode;
    private String codechef;
    private String hackerrank;
}
