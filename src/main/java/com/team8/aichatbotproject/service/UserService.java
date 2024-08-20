package com.team8.aichatbotproject.service;

import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User findUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }
}
