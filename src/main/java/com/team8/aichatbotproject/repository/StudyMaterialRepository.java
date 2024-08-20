package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.StudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {
    List<StudyMaterial> findBySubject_SubjectId(Long subjectId);
}