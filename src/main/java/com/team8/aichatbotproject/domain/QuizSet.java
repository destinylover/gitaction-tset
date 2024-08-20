package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "quiz_set")
public class QuizSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long quizsetId;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private Integer numberOfQuestions;
    private Integer score;

    @OneToMany(mappedBy = "quizSet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Question> questions;

    @OneToMany(mappedBy = "quizSet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserQuizsetAttempt> userQuizsetAttempts;

    @Override
    public String toString() {
        return "QuizSet{" +
                "quizsetId=" + quizsetId +
                ", subject=" + subject +
                ", createdAt=" + createdAt +
                ", numberOfQuestions=" + numberOfQuestions +
                ", score=" + score +
                '}';
    }
}
