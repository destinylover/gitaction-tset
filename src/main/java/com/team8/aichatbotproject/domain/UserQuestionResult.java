package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_question_result")
public class    UserQuestionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long resultId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne
    @JoinColumn(name = "user_option_id", nullable = false)
    private Option userOption;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Boolean isBookmarked;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Override
    public String toString() {
        return "UserQuestionResult{" +
                "resultId=" + resultId +
                ", user=" + user +
                ", question=" + question +
                ", userOption=" + userOption +
                ", isCorrect=" + isCorrect +
                ", isBookmarked=" + isBookmarked +
                ", createdAt=" + createdAt +
                '}';
    }
}