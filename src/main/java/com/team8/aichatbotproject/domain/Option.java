package com.team8.aichatbotproject.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "options")
public class Option {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionId;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private String optionContent;

    @Column(nullable = false)
    private Boolean isCorrect;

    @OneToMany(mappedBy = "userOption", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserQuestionResult> userQuestionResults;


    @Override
    public String toString() {
        return "Option{" +
                "optionId=" + optionId +
                ", question=" + question +
                ", optionContent='" + optionContent + '\'' +
                ", isCorrect=" + isCorrect +
                '}';
    }
}