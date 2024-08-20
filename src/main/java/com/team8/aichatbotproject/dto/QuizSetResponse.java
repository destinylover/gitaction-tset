package com.team8.aichatbotproject.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public class QuizSetResponse {
    private Long quizsetId;
    private Long subjectId;
    private LocalDateTime createdAt;
    private Integer numberOfQuestions;
    private Integer score;

    public QuizSetResponse(Long quizsetId, Long subjectId, LocalDateTime createdAt, Integer numberOfQuestions, Integer score) {
        this.quizsetId = quizsetId;
        this.subjectId = subjectId;
        this.createdAt = createdAt;
        this.numberOfQuestions = numberOfQuestions;
        this.score = score;
    }
}
