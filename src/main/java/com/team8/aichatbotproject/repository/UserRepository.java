package com.team8.aichatbotproject.repository;

import com.team8.aichatbotproject.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    // 아이디로 user 조회
    User findByUserId(Long id);
    // 이메일로 user 조회
    User findByEmail(String email);

    @Query("select u from User u where u.email = :email AND u.password = :password")
    User findByEmailAndPassword(@Param("email") String email, @Param("password") String password);
}