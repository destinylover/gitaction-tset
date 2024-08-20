package com.team8.aichatbotproject.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.team8.aichatbotproject.domain.*;
import com.team8.aichatbotproject.dto.OptionDTO;
import com.team8.aichatbotproject.dto.QuestionDTO;
import com.team8.aichatbotproject.dto.QuizResponse;
import com.team8.aichatbotproject.dto.QuizSetResponse;
import com.team8.aichatbotproject.dto.UserQuizsetAttemptDTO;
import com.team8.aichatbotproject.repository.*;
import com.team8.aichatbotproject.service.QuizService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizSetRepository quizSetRepository;

    @Autowired
    private OptionRepository optionRepository;

    @Autowired
    private UserQuestionResultRepository userQuestionResultRepository;

    @Autowired
    private UserQuizsetAttemptRepository userQuizsetAttemptRepository;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateQuiz(@RequestParam Long subjectId, @RequestParam int numberOfQuestions, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "유효하지 않은 사용자입니다."));
        }

        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject == null) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", "주제를 찾을 수 없습니다."));
        }

        String quizContent = quizService.generateQuizContent(user, subject, numberOfQuestions);
        if (quizContent == null) {
            return ResponseEntity.status(500).body(Collections.singletonMap("error", "퀴즈 생성 중 오류가 발생했습니다."));
        }
        // 문제 생성
        QuizSet quizSet = new QuizSet();
        quizSet.setSubject(subject);
        quizSet.setNumberOfQuestions(numberOfQuestions);
        quizSet.setScore(null);    // 초기 점수 설정, JS 에서 null 은 "문제 풀이 진행 중"이라는 문구를 표시.
        quizSet.setCreatedAt(LocalDateTime.now());
        quizSetRepository.save(quizSet);

        try {
            List<QuizResponse> quizResponses = quizService.saveQuiz(quizSet, quizContent, numberOfQuestions);
            Map<String, Object> response = new HashMap<>();
            response.put("quizsetId", quizSet.getQuizsetId());
            response.put("quizzes", quizResponses);
            return ResponseEntity.ok(response);
        } catch (JsonProcessingException e) {
            quizService.deleteQuizSetAndQuestions(quizSet);
            return ResponseEntity.status(500).body(Collections.singletonMap("error", "퀴즈 응답 변환 중 오류가 발생했습니다."));
        } catch (Exception e) {
            quizService.deleteQuizSetAndQuestions(quizSet);
            return ResponseEntity.status(500).body(Collections.singletonMap("error", "퀴즈 생성 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/sets/{subjectId}")
    public ResponseEntity<List<QuizSetResponse>> getQuizSetsBySubject(@PathVariable Long subjectId) {
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId);
        List<QuizSetResponse> quizSetResponses = quizSets.stream()
                .map(quizSet -> new QuizSetResponse(
                        quizSet.getQuizsetId(),
                        quizSet.getSubject().getSubjectId(),
                        quizSet.getCreatedAt(),
                        quizSet.getNumberOfQuestions(),
                        quizSet.getScore()
                )).collect(Collectors.toList());
        return ResponseEntity.ok(quizSetResponses);
    }

    // QuizSet 삭제
    @DeleteMapping("/set/{quizSetId}")
    public ResponseEntity<Void> deleteQuizSet(@PathVariable Long quizSetId) {
        QuizSet quizSet = quizSetRepository.findById(quizSetId).orElse(null);
        if (quizSet == null) {
            return ResponseEntity.notFound().build();
        }
        quizService.deleteAll(quizSet);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        try {
            quizService.deleteQuestionById(questionId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/set/{quizSetId}/questions")
    public ResponseEntity<List<QuestionDTO>> getQuestionsByQuizSet(@PathVariable Long quizSetId) {
        QuizSet quizSet = quizSetRepository.findById(quizSetId)
                .orElseThrow(() -> new EntityNotFoundException("QuizSet not found"));

        List<QuestionDTO> questionDTOs = quizSet.getQuestions().stream().map(question -> {
            QuestionDTO questionDTO = new QuestionDTO();
            questionDTO.setQuestionId(question.getQuestionId());
            questionDTO.setQuestionContent(question.getQuestionContent());
            List<OptionDTO> optionDTOs = question.getOptions().stream().map(option -> {
                OptionDTO optionDTO = new OptionDTO();
                optionDTO.setOptionId(option.getOptionId());
                optionDTO.setOptionContent(option.getOptionContent());
                return optionDTO;
            }).collect(Collectors.toList());
            questionDTO.setOptions(optionDTOs);
            return questionDTO;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(questionDTOs);
    }

    @GetMapping("/attempt/{quizSetId}")
    public ResponseEntity<UserQuizsetAttemptDTO> startOrContinueQuiz(@PathVariable Long quizSetId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        QuizSet quizSet = quizSetRepository.findById(quizSetId).orElse(null);
        if (quizSet == null) {
            return ResponseEntity.status(404).build();
        }

        UserQuizsetAttempt attempt = quizService.startOrContinueQuizSet(user, quizSet);
        UserQuizsetAttemptDTO response = new UserQuizsetAttemptDTO(attempt);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/attempt/{attemptId}/answer")
    public ResponseEntity<?> submitAnswer(@PathVariable Long attemptId, @RequestParam Long optionId, @RequestParam boolean isBookmarked) {
        UserQuizsetAttempt attempt = userQuizsetAttemptRepository.findById(attemptId).orElse(null);
        if (attempt == null) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", "퀴즈 시도를 찾을 수 없습니다."));
        }

        Option selectedOption = optionRepository.findById(optionId).orElse(null);
        if (selectedOption == null) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", "선택된 옵션을 찾을 수 없습니다."));
        }

        Question currentQuestion = attempt.getCurrentQuestion();
        boolean isCorrect = selectedOption.getIsCorrect();

        quizService.saveUserQuestionResult(attempt.getUser(), currentQuestion, selectedOption, isCorrect, isBookmarked);
        quizService.moveToNextQuestion(attempt);

        if (attempt.getIsComplete()) {
            quizService.completeQuizSet(attempt); // 최종 점수 계산 및 저장
        }

        UserQuizsetAttemptDTO response = new UserQuizsetAttemptDTO(attempt);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/set/{quizSetId}/result")
    public ResponseEntity<?> getQuizSetResult(@PathVariable Long quizSetId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "유효하지 않은 사용자입니다."));
        }

        QuizSet quizSet = quizSetRepository.findById(quizSetId).orElse(null);
        if (quizSet == null) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", "퀴즈 세트를 찾을 수 없습니다."));
        }

        Map<String, Object> result = quizService.getQuizSetResults(quizSet, user);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/bookmarked/{subjectId}")
    public ResponseEntity<?> getBookmarkedQuestionsBySubject(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        List<Map<String, Object>> result = quizService.getBookmarkedQuestionsBySubject(subjectId, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bookmark/toggle")
    public ResponseEntity<?> toggleBookmark(@RequestParam Long questionId, @RequestParam boolean isBookmarked, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        quizService.updateBookmarkStatus(userId, questionId, isBookmarked);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/incorrect/{subjectId}")
    public ResponseEntity<?> getIncorrectQuestionsBySubject(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "유효하지 않은 사용자입니다."));
        }

        List<Map<String, Object>> result = quizService.getIncorrectQuestionsBySubject(subjectId, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/attempt/review")
    public ResponseEntity<?> submitReviewAnswer(@RequestParam Long questionId, @RequestParam Long optionId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "유효하지 않은 사용자입니다."));
        }

        UserQuestionResult result = quizService.saveReviewQuestionResult(userId, questionId, optionId);

        Map<String, Object> response = new HashMap<>();
        response.put("questionId", result.getQuestion().getQuestionId());
        response.put("questionContent", result.getQuestion().getQuestionContent());
        response.put("explanation", result.getQuestion().getExplanation());
        response.put("isBookmarked", result.getIsBookmarked());
        response.put("userSelectedOptionId", result.getUserOption().getOptionId());
        response.put("userSelectedOptionCorrect", result.getIsCorrect());

        List<Map<String, Object>> options = new ArrayList<>();
        for (Option option : result.getQuestion().getOptions()) {
            Map<String, Object> optionData = new HashMap<>();
            optionData.put("optionId", option.getOptionId());
            optionData.put("optionContent", option.getOptionContent());
            optionData.put("isCorrect", option.getIsCorrect());
            options.add(optionData);
        }
        response.put("options", options);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/review/{subjectId}")
    public ResponseEntity<?> getReviewQuestion(@PathVariable Long subjectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "로그인이 필요합니다."));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("error", "유효하지 않은 사용자입니다."));
        }

        Question question = quizService.getRandomReviewQuestion(userId, subjectId);
        if (question == null) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", "복습할 문제가 없습니다."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("questionId", question.getQuestionId());
        response.put("questionContent", question.getQuestionContent());
        response.put("explanation", question.getExplanation());

        // 사용자 문제 풀이 기록에서 즐겨찾기 여부를 가져옴
        List<UserQuestionResult> userQuestionResults = userQuestionResultRepository
                .findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, question.getQuestionId());
        if (!userQuestionResults.isEmpty()) {
            response.put("isBookmarked", userQuestionResults.get(0).getIsBookmarked());
        } else {
            response.put("isBookmarked", false);
        }

        List<Map<String, Object>> options = new ArrayList<>();
        for (Option option : question.getOptions()) {
            Map<String, Object> optionData = new HashMap<>();
            optionData.put("optionId", option.getOptionId());
            optionData.put("optionContent", option.getOptionContent());
            optionData.put("isCorrect", option.getIsCorrect());
            options.add(optionData);
        }
        response.put("options", options);

        return ResponseEntity.ok(response);
    }
}