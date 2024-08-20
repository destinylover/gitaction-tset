package com.team8.aichatbotproject.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String email;
    private String password;
    private String confirmPassword;
    private Integer age;
    private String job;
    private String educationLevel;
}
