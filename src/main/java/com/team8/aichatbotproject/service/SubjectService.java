package com.team8.aichatbotproject.service;

import com.team8.aichatbotproject.domain.StudyMaterial;
import com.team8.aichatbotproject.domain.Subject;
import com.team8.aichatbotproject.domain.Summary;
import com.team8.aichatbotproject.domain.User;
import com.team8.aichatbotproject.dto.GptRequest;
import com.team8.aichatbotproject.dto.GptResponse;
import com.team8.aichatbotproject.repository.SubjectRepository;
import com.team8.aichatbotproject.repository.SummaryRepository;
import com.team8.aichatbotproject.repository.StudyMaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SubjectService {

    private static final Logger logger = LoggerFactory.getLogger(SubjectService.class);

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private StudyMaterialRepository studyMaterialRepository;

    @Autowired
    private RestTemplate template;

    @Value("${openai.model}")
    private String model;

    @Value("${openai.api.url}")
    private String apiURL;

    public String getSubjectSummaryContent(Long subjectId) {
        Summary summary = summaryRepository.findBySubject_SubjectId(subjectId);
        return summary != null ? summary.getSummaryContent() : "요약이 아직 없습니다.";
    }

    public boolean renameSubject(User user, Long subjectId, String newName) {
        Subject subject = subjectRepository.findBySubjectIdAndUser(subjectId, user);
        if (subject != null) {
            subject.setSubjectName(newName);
            subjectRepository.save(subject);
            return true;
        }
        return false;
    }

    public boolean deleteSubject(User user, Long subjectId) {
        Subject subject = subjectRepository.findBySubjectIdAndUser(subjectId, user);
        if (subject != null) {
            subjectRepository.delete(subject);
            return true;
        }
        return false;
    }

    public String generateAndSaveSummary(Long subjectId) {
        Summary existingSummary = summaryRepository.findBySubject_SubjectId(subjectId);
        if (existingSummary != null) {
            return existingSummary.getSummaryContent();
        }

        List<StudyMaterial> materials = studyMaterialRepository.findBySubject_SubjectId(subjectId);
        StringBuilder contentBuilder = new StringBuilder();

        for (StudyMaterial material : materials) {
            contentBuilder.append(material.getFileContent()).append("\n");
        }

        String prompt = "다음 내용을 요약해 주세요: \n" + contentBuilder.toString();

        GptRequest request = new GptRequest(model, prompt);
        try {
            GptResponse response = template.postForObject(apiURL, request, GptResponse.class);

            if (response != null && !response.getChoices().isEmpty()) {
                String summary = response.getChoices().get(0).getMessage().getContent();
                logger.info("GPT 응답 내용: \n" + summary); // GPT 응답 내용 로그로 출력

                Summary summaryEntity = new Summary();
                summaryEntity.setSubject(subjectRepository.findById(subjectId).orElse(null));
                summaryEntity.setSummaryContent(summary);
                summaryEntity.setCreatedAt(LocalDateTime.now());
                summaryRepository.save(summaryEntity);

                return summary;
            } else {
                logger.error("GPT 응답이 비어있습니다.");
                return null;
            }
        } catch (Exception e) {
            logger.error("GPT API 호출 중 오류 발생", e);
            return null;
        }
    }
}
