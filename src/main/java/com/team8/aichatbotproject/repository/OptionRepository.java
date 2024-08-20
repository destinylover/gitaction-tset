package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OptionRepository extends JpaRepository<Option, Long> {}
