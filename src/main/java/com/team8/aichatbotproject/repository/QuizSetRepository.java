package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizSetRepository extends JpaRepository<QuizSet, Long> {
    List<QuizSet> findBySubject_SubjectId(Long subjectId);
}