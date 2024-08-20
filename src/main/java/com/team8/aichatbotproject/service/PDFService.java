package com.team8.aichatbotproject.service;

import com.team8.aichatbotproject.domain.Subject;
import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.dto.PDFContentDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PDFService {
    // PDF 파일을 처리하는 서비스로, PDFBox 라이브러리를 사용해 PDF 파일의 텍스트를 추출하고, 추출된 내용을 DatabaseService 를 통해 데이터베이스에 저장
    @Autowired
    private DatabaseService databaseService;

    public String extractContent(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    public Subject createSubject(User user) {
        LocalDateTime createdAt = LocalDateTime.now();
        String subjectName = "주제 " + (databaseService.findSubjectsByUser(user).size() + 1);
        return databaseService.createSubject(user, subjectName, createdAt);
    }

    public void saveStudyMaterial(MultipartFile file, Subject subject) throws IOException {
        String content = extractContent(file);

        LocalDateTime uploadedAt = LocalDateTime.now();
        PDFContentDTO pdfContentDTO = new PDFContentDTO(content, file.getOriginalFilename(), uploadedAt, subject.getSubjectId());
        databaseService.saveContent(pdfContentDTO);
    }

    public List<Subject> getUserSubjects(User user) {
        return databaseService.findSubjectsByUser(user);
    }
}