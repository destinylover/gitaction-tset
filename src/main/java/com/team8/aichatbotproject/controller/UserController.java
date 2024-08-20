package com.team8.aichatbotproject.controller;

import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.dto.UserDTO;
import com.team8.aichatbotproject.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private static final String PASSWORD_PATTERN =
            "^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+=<>?{}\\[\\]~-]).{8,}$";

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserDTO userDTO) {
        // 패스워드와 확인 패스워드 일치 확인
        if (!userDTO.getPassword().equals(userDTO.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("비밀번호를 다시 입력하세요.");
        }

        if (!isValidPassword(userDTO.getPassword())) {
            return ResponseEntity.badRequest().body("비밀번호는 최소 8자 이상이어야 하며, 영문자, 숫자, 특수 문자를 포함해야 합니다.");
        }

        User user = new User();
        user.setEmail(userDTO.getEmail());
        user.setPassword(userDTO.getPassword());
        user.setAge(userDTO.getAge());
        user.setJob(userDTO.getJob());
        user.setEducationLevel(userDTO.getEducationLevel());

        userRepository.save(user);
        return ResponseEntity.ok("회원가입 성공");
    }

    private boolean isValidPassword(String password) {
        return Pattern.compile(PASSWORD_PATTERN).matcher(password).matches();
    }

    @PostMapping("/login")
    public ResponseEntity<String> loginUser(@RequestBody UserDTO userDTO, HttpSession session) {
        User user = userRepository.findByEmailAndPassword(userDTO.getEmail(), userDTO.getPassword());
        if (user == null) {
            return ResponseEntity.status(401).body("이메일이나 비밀번호 오류");
        }
        session.setAttribute("userId", user.getUserId());
        return ResponseEntity.ok("로그인 성공");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logoutUser(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("로그아웃 성공");
    }

    @GetMapping("/session")
    public ResponseEntity<Boolean> checkSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        return ResponseEntity.ok(userId != null);
    }
}