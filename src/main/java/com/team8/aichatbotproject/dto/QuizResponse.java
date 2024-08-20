package com.team8.aichatbotproject.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QuizResponse {
    private String questionContent;
    private List<String> options;
    private int correctOption;
    private String explanation;
}
