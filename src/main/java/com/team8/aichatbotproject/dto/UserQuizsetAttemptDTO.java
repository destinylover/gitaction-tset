package com.team8.aichatbotproject.dto;

import com.team8.aichatbotproject.domain.UserQuizsetAttempt;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserQuizsetAttemptDTO {
    private Long attemptId;
    private Long currentQuestionId;
    private boolean isComplete;

    public UserQuizsetAttemptDTO(UserQuizsetAttempt attempt) {
        this.attemptId = attempt.getAttemptId();
        this.currentQuestionId = attempt.getCurrentQuestion() != null ? attempt.getCurrentQuestion().getQuestionId() : null;
        this.isComplete = attempt.getIsComplete();
    }
}
