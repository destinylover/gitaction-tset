package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.Subject;
import com.team8.aichatbotproject.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Subject findBySubjectIdAndUser(Long subjectId, User user);
}
