package com.team8.aichatbotproject.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class StudyMaterialDTO {
    private Long materialId;
    private Long subjectId;
    private String fileName;
    private String fileContent;
    private LocalDateTime uploadedAt;
}
