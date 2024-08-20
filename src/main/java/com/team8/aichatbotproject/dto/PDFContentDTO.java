package com.team8.aichatbotproject.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class PDFContentDTO {
    private String fileLocation; // PDF에서 파싱한 내용
    private String fileName;
    private LocalDateTime uploadedAt;
    private Long subjectId;

    public PDFContentDTO(String fileLocation, String fileName, LocalDateTime uploadedAt, Long subjectId) {
        this.fileLocation = fileLocation;
        this.fileName = fileName;
        this.uploadedAt = uploadedAt;
        this.subjectId = subjectId;
    }

}