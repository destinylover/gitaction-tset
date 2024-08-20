package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.Question;
import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.domain.UserQuestionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuestionResultRepository extends JpaRepository<UserQuestionResult, Long> {
    long countByUserAndQuestionAndIsCorrect(User user, Question question, boolean isCorrect);
    UserQuestionResult findFirstByUserAndQuestionOrderByCreatedAtAsc(User user, Question question);
    UserQuestionResult findTopByUser_UserIdAndQuestion_QuestionIdAndIsBookmarkedOrderByCreatedAtDesc(Long userId, Long questionId, boolean isBookmarked);
    UserQuestionResult findTopByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(Long userId, Long questionId);
    List<UserQuestionResult> findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(Long userId, Long questionId);
}
