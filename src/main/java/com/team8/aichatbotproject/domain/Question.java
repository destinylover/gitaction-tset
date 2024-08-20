package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "question")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long questionId;

    @ManyToOne
    @JoinColumn(name = "quizset_id", nullable = false)
    private QuizSet quizSet;

    @Column(nullable = false)
    private String questionContent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Option> options;

    @OneToMany(mappedBy = "currentQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserQuizsetAttempt> userQuizsetAttempts;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserQuestionResult> userQuestionResults;

    @Override
    public String toString() {
        return "Question{" +
                "questionId=" + questionId +
                ", quizSet=" + quizSet +
                ", questionContent='" + questionContent + '\'' +
                ", explanation='" + explanation + '\'' +
                '}';
    }
}
