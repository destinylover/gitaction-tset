package com.team8.aichatbotproject.service;

import com.team8.aichatbotproject.domain.Subject;
import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.dto.PDFContentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DatabaseService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void saveContent(PDFContentDTO pdfContentDTO) {
        String sql = "INSERT INTO study_material (file_content, file_name, uploaded_at, subject_id) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, pdfContentDTO.getFileLocation(), pdfContentDTO.getFileName(), pdfContentDTO.getUploadedAt(), pdfContentDTO.getSubjectId());
    }

    public Subject createSubject(User user, String subjectName, LocalDateTime createdAt) {
        String sql = "INSERT INTO subject (user_id, subject_name, created_at) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, user.getUserId(), subjectName, createdAt);

        // 방금 생성된 Subject ID를 반환
        return jdbcTemplate.queryForObject("SELECT * FROM subject WHERE user_id = ? AND subject_name = ? ORDER BY created_at DESC LIMIT 1",
                new Object[]{user.getUserId(), subjectName},
                (rs, rowNum) -> {
                    Subject subject = new Subject();
                    subject.setSubjectId(rs.getLong("subject_id"));
                    subject.setUser(user);
                    subject.setSubjectName(rs.getString("subject_name"));
                    subject.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    return subject;
                }
        );
    }

    public List<Subject> findSubjectsByUser(User user) {
        String sql = "SELECT * FROM subject WHERE user_id = ?";
        return jdbcTemplate.query(sql, new Object[]{user.getUserId()},
                (rs, rowNum) -> {
                    Subject subject = new Subject();
                    subject.setSubjectId(rs.getLong("subject_id"));
                    subject.setUser(user);
                    subject.setSubjectName(rs.getString("subject_name"));
                    subject.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                    return subject;
                }
        );
    }
}
