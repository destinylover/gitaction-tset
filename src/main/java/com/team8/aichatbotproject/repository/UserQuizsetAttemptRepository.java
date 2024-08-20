package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.UserQuizsetAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserQuizsetAttemptRepository extends JpaRepository<UserQuizsetAttempt, Long> {
    Optional<UserQuizsetAttempt> findByUser_UserIdAndQuizSet_QuizsetId(Long userId, Long quizSetId);

    // 특정 퀴즈 세트에 대한 모든 사용자 시도 가져오기
    List<UserQuizsetAttempt> findByQuizSet_QuizsetId(Long quizSetId);
}