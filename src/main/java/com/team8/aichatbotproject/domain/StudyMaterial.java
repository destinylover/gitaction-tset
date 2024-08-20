package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "study_material")
public class StudyMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long materialId;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String fileContent;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Override
    public String toString() {
        return "StudyMaterial{" +
                "materialId=" + materialId +
                ", subject=" + subject +
                ", fileName='" + fileName + '\'' +
                ", fileLocation='" + fileContent + '\'' +
                ", uploadedAt=" + uploadedAt +
                '}';
    }
}