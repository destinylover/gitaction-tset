package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "summary")
public class Summary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long summaryId;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summaryContent;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Override
    public String toString() {
        return "Summary{" +
                "summaryId=" + summaryId +
                ", subject=" + subject +
                ", summaryContent='" + summaryContent + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}