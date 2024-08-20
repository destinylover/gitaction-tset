package com.team8.aichatbotproject.controller;

import com.team8.aichatbotproject.domain.Subject;
import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.repository.UserRepository;
import com.team8.aichatbotproject.service.PDFService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.IOException;

@Controller
@RequestMapping("/api") // 추가하여 URL 경로가 /api/upload 가 되도록 함
public class FileUploadController {
    // 파일 업로드 요청을 처리하는 컨트롤러 사용자로부터 PDF 파일을 받아서, 서비스를 통해 데이터베이스에 저장하는 로직을 구현
    private final PDFService pdfService;
    private final UserRepository userRepository;

    public FileUploadController(PDFService pdfService, UserRepository userRepository) {
        this.pdfService = pdfService;
        this.userRepository = userRepository;
    }

    @PostMapping("/upload")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> uploadPDF(@RequestParam("file") MultipartFile file, HttpSession session) {
        Map<String, Object> response = new HashMap<>();

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            response.put("success", false);
            response.put("message", "로그인이 필요합니다.");
            return ResponseEntity.status(401).body(response);
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            response.put("success", false);
            response.put("message", "유효하지 않은 사용자입니다.");
            return ResponseEntity.status(401).body(response);
        }

        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "파일을 선택해 주세요.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 주제 생성
            Subject newSubject = pdfService.createSubject(user);
            // 학습 자료 저장
            pdfService.saveStudyMaterial(file, newSubject);
            response.put("success", true);
            response.put("message", "파일이 성공적으로 업로드되었습니다.");
            response.put("subjectId", newSubject.getSubjectId());
            response.put("subjectName", newSubject.getSubjectName());
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "파일 업로드에 실패했습니다: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/subjects")
    @ResponseBody
    public ResponseEntity<List<Subject>> getUserSubjects(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(null);
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        List<Subject> subjects = pdfService.getUserSubjects(user);
        return ResponseEntity.ok(subjects);
    }
}