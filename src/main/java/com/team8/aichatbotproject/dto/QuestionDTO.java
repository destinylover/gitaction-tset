package com.team8.aichatbotproject.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
public class QuestionDTO {
    private Long questionId;
    private String questionContent;
    private List<OptionDTO> options;
}
