package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    Summary findBySubject_SubjectId(Long subjectId);
}
