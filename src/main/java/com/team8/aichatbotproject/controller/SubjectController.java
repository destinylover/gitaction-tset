package com.team8.aichatbotproject.controller;

import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.dto.SubjectRenameRequest;
import com.team8.aichatbotproject.repository.UserRepository;
import com.team8.aichatbotproject.service.SubjectService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{subjectId}/summary")
    public ResponseEntity<String> getSubjectSummary(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        String summaryContent = subjectService.getSubjectSummaryContent(subjectId);
        if (summaryContent != null) {
            return ResponseEntity.ok(summaryContent);
        } else {
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/{subjectId}/generate-summary")
    public ResponseEntity<String> generateSummary(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return ResponseEntity.status(401).body("유효하지 않은 사용자입니다.");
        }

        String summary = subjectService.generateAndSaveSummary(subjectId);

        if (summary == null) {
            return ResponseEntity.status(500).body("요약 생성 중 오류가 발생했습니다.");
        }

        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{subjectId}/rename")
    public ResponseEntity<String> renameSubject(@PathVariable Long subjectId, @RequestBody SubjectRenameRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return ResponseEntity.status(401).body("유효하지 않은 사용자입니다.");
        }

        boolean renamed = subjectService.renameSubject(user, subjectId, request.getNewName());
        if (renamed) {
            return ResponseEntity.ok("주제 이름이 변경되었습니다.");
        } else {
            return ResponseEntity.status(403).body("주제 이름 변경에 실패했습니다.");
        }
    }

    @DeleteMapping("/{subjectId}/delete")
    public ResponseEntity<String> deleteSubject(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return ResponseEntity.status(401).body("유효하지 않은 사용자입니다.");
        }

        boolean deleted = subjectService.deleteSubject(user, subjectId);
        if (deleted) {
            return ResponseEntity.ok("주제가 삭제되었습니다.");
        } else {
            return ResponseEntity.status(403).body("주제 삭제에 실패했습니다.");
        }
    }
}
