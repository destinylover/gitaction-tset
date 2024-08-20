package com.team8.aichatbotproject.service;

import com.team8.aichatbotproject.domain.*;
import com.team8.aichatbotproject.dto.GptRequest;
import com.team8.aichatbotproject.dto.GptResponse;
import com.team8.aichatbotproject.dto.QuizResponse;
import com.team8.aichatbotproject.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    @Autowired
    private RestTemplate template;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizSetRepository quizSetRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private OptionRepository optionRepository;

    @Autowired
    private UserQuizsetAttemptRepository userQuizsetAttemptRepository;

    @Autowired
    private UserQuestionResultRepository userQuestionResultRepository;

    @org.springframework.beans.factory.annotation.Value("${openai.model}")
    private String model;

    @Value("${openai.api.url}")
    private String apiURL;

    public String generateQuizContent(User user, Subject subject, int numberOfQuestions) {
        String prompt = createPrompt(user, subject, numberOfQuestions);

        GptRequest request = new GptRequest(model, prompt);
        try {
            GptResponse response = template.postForObject(apiURL, request, GptResponse.class);

            if (response != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                logger.info("GPT 응답 내용: \n" + content); // GPT 응답 내용 로그로 출력
                return content;
            } else {
                logger.error("GPT 응답이 비어있습니다.");
                return null;
            }
        } catch (Exception e) {
            logger.error("GPT API 호출 중 오류 발생", e);
            return null;
        }
    }

    private String createPrompt(User user, Subject subject, int numberOfQuestions) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("=====================================필수 조건===================================\n");
        promptBuilder.append("사용자의 나이: ").append(user.getAge()).append(", ");
        promptBuilder.append("교육 수준: ").append(user.getEducationLevel()).append(", ");
        promptBuilder.append("직업: ").append(user.getJob()).append("을 고려하여 다음 내용에 대해, 총 ");
        promptBuilder.append(numberOfQuestions).append("개의 객관식 문제를 생성하라. 보기는 4개씩이다. 문제 개수와 보기 개수를 지켜라.\n");
        promptBuilder.append("각 문제는 무조건 다음 형식을 따라야 한다. 순서도 중요하다.\n");
        promptBuilder.append("문제 내용, 보기1, 보기2, 보기3, 보기4, 정답인 보기의 숫자, 간단한 해설, 이렇게 7 항목일 것.\n");
        promptBuilder.append("*** 이 기호 3개로 output을 파싱할 것이니, \"각 항목마다 앞에 ***을 붙일 것.\"");
        promptBuilder.append("출력 예시:\n");
        promptBuilder.append("***1+1의 답으로 옳은 것은?\n");
        promptBuilder.append("***0이다.\n");
        promptBuilder.append("***1이다.\n");
        promptBuilder.append("***2이다.\n");
        promptBuilder.append("***3이다.\n");
        promptBuilder.append("***3\n");
        promptBuilder.append("***1+1은 2이다.\n");
        promptBuilder.append("***1+2의 답으로 옳은 것은?\n");
        promptBuilder.append("***0이다.\n");
        promptBuilder.append("***1이다.\n");
        promptBuilder.append("***2이다.\n");
        promptBuilder.append("***3이다.\n");
        promptBuilder.append("***4\n");
        promptBuilder.append("***1+2는 3이다.\n");
        promptBuilder.append("***1+2의 답으로 옳은 것은?\n");
        promptBuilder.append("...... 이어서\n");
        promptBuilder.append("==============================================================================\n");
        promptBuilder.append("이 위에 적힌 내용은 필수로 지켜야 하고, 다음으로 나오는 내용에서 문제를 출제하면 된다:\n");

        // 주제의 학습자료 내용을 추가
        for (StudyMaterial material : subject.getStudyMaterials()) {
            promptBuilder.append(material.getFileContent()).append("\n");
        }

        return promptBuilder.toString();
    }

    public List<QuizResponse> saveQuiz(QuizSet quizSet, String quizContent, int expectedNumberOfQuestions) throws Exception {
        // quizContent를 파싱하여 문제와 보기 저장 로직 구현
        String[] questions = quizContent.split("\\*\\*\\*"); // *** 기호로 구분
        List<Question> questionList = new ArrayList<>();
        List<QuizResponse> quizResponses = new ArrayList<>();

        if ((questions.length - 1) / 7 != expectedNumberOfQuestions) {
            deleteQuizSetAndQuestions(quizSet);
            throw new IllegalArgumentException("생성된 문제 개수가 요청한 개수와 일치하지 않습니다.");
        }

        try {
            for (int i = 1; i < questions.length; i += 7) {
                String questionContent = questions[i].trim();
                String[] options = {questions[i + 1].trim(), questions[i + 2].trim(), questions[i + 3].trim(), questions[i + 4].trim(), "잘 모르겠음"};
                int correctOptionIndex = Integer.parseInt(questions[i + 5].trim()) - 1;
                String explanation = questions[i + 6].trim();

                Question question = new Question();
                question.setQuizSet(quizSet);
                question.setQuestionContent(questionContent);
                question.setExplanation(explanation);
                questionRepository.save(question);

                List<Option> optionList = new ArrayList<>();
                for (int j = 0; j < options.length; j++) {
                    Option option = new Option();
                    option.setQuestion(question);
                    option.setOptionContent(options[j]);
                    option.setIsCorrect(j == correctOptionIndex); // 정답 여부 설정
                    optionList.add(option);
                }
                optionRepository.saveAll(optionList);
                question.setOptions(optionList);
                questionList.add(question);

                // 퀴즈 응답 객체 생성
                QuizResponse quizResponse = new QuizResponse();
                quizResponse.setQuestionContent(questionContent);
                quizResponse.setOptions(Arrays.asList(options));
                quizResponse.setCorrectOption(correctOptionIndex + 1);
                quizResponse.setExplanation(explanation);
                quizResponses.add(quizResponse);
            }

            quizSet.setQuestions(questionList);
            quizSetRepository.save(quizSet);
            return quizResponses;

        } catch (Exception e) {
            deleteQuizSetAndQuestions(quizSet); // 오류 발생 시 삭제
            throw e;
        }
    }

    public void deleteQuizSetAndQuestions(QuizSet quizSet) {
        // 연관된 질문 및 옵션 삭제
        if (quizSet != null && quizSet.getQuestions() != null) {
            for (Question question : quizSet.getQuestions()) {
                optionRepository.deleteAll(question.getOptions());
            }
            questionRepository.deleteAll(quizSet.getQuestions());
        }
        quizSetRepository.delete(quizSet);
    }

    @Transactional
    public void deleteAll(QuizSet quizSet) {
        for (Question question : quizSet.getQuestions()) {
            question.getOptions().clear(); // Options 제거
        }

        quizSet.getQuestions().clear(); // Questions 제거
        quizSetRepository.delete(quizSet);
    }

    // 사용자가 퀴즈 세트를 처음 시작하거나 이어서 풀기
    public UserQuizsetAttempt startOrContinueQuizSet(User user, QuizSet quizSet) {
        Optional<UserQuizsetAttempt> attemptOpt = userQuizsetAttemptRepository.findByUser_UserIdAndQuizSet_QuizsetId(user.getUserId(), quizSet.getQuizsetId());

        if (attemptOpt.isPresent()) {
            return attemptOpt.get();
        } else {
            UserQuizsetAttempt newAttempt = new UserQuizsetAttempt();
            newAttempt.setUser(user);
            newAttempt.setQuizSet(quizSet);
            newAttempt.setCurrentQuestion(quizSet.getQuestions().get(0)); // 첫 번째 질문으로 시작
            newAttempt.setIsComplete(false);
            return userQuizsetAttemptRepository.save(newAttempt);
        }
    }

    // 사용자 문제 결과 저장
    public void saveUserQuestionResult(User user, Question question, Option userOption, boolean isCorrect, boolean isBookmarked) {
        UserQuestionResult result = new UserQuestionResult();
        result.setUser(user);
        result.setQuestion(question);
        result.setUserOption(userOption);
        result.setIsCorrect(isCorrect);
        result.setIsBookmarked(isBookmarked);
        result.setCreatedAt(LocalDateTime.now());
        userQuestionResultRepository.save(result);
    }

    // 다음 질문으로 이동
    public void moveToNextQuestion(UserQuizsetAttempt attempt) {
        QuizSet quizSet = attempt.getQuizSet();
        int currentIndex = quizSet.getQuestions().indexOf(attempt.getCurrentQuestion());
        if (currentIndex + 1 < quizSet.getQuestions().size()) {
            attempt.setCurrentQuestion(quizSet.getQuestions().get(currentIndex + 1));
            userQuizsetAttemptRepository.save(attempt);
        } else {
            completeQuizSet(attempt); // 마지막 질문인 경우 완료 처리
        }
    }

    // 퀴즈 세트 완료 처리
    public void completeQuizSet(UserQuizsetAttempt attempt) {
        attempt.setIsComplete(true);
        userQuizsetAttemptRepository.save(attempt);
        if (attempt.getQuizSet().getScore() == null) { // 점수가 null일 때만 업데이트
            updateQuizSetScore(attempt);
        }
    }

    // 퀴즈 세트의 점수를 계산하고 업데이트
    public void updateQuizSetScore(UserQuizsetAttempt attempt) {
        QuizSet quizSet = attempt.getQuizSet();
        User user = attempt.getUser();
        List<Question> questions = quizSet.getQuestions();
        int totalQuestions = questions.size();
        int correctAnswers = 0;

        for (Question question : questions) {
            long correctCount = userQuestionResultRepository.countByUserAndQuestionAndIsCorrect(user, question, true);
            if (correctCount > 0) {
                correctAnswers++;
            }
        }

        int score = (int) ((double) correctAnswers / totalQuestions * 100); // 점수를 백분율로 계산
        quizSet.setScore(score);
        quizSetRepository.save(quizSet);
    }

    // 퀴즈 세트의 결과를 생성
    public Map<String, Object> getQuizSetResults(QuizSet quizSet, User user) {
        Map<String, Object> result = new HashMap<>();
        result.put("score", quizSet.getScore());

        List<Map<String, Object>> questions = new ArrayList<>();
        for (Question question : quizSet.getQuestions()) {
            Map<String, Object> questionData = new HashMap<>();
            questionData.put("questionId", question.getQuestionId());
            questionData.put("questionContent", question.getQuestionContent());
            questionData.put("explanation", question.getExplanation());

            List<Map<String, Object>> options = new ArrayList<>();
            for (Option option : question.getOptions()) {
                Map<String, Object> optionData = new HashMap<>();
                optionData.put("optionContent", option.getOptionContent());
                optionData.put("isCorrect", option.getIsCorrect());
                options.add(optionData);
            }
            questionData.put("options", options);

            UserQuestionResult userResult = userQuestionResultRepository.findFirstByUserAndQuestionOrderByCreatedAtAsc(user, question);
            questionData.put("userSelectedOption", userResult != null ? userResult.getUserOption().getOptionContent() : null);
            questionData.put("userSelectedOptionCorrect", userResult != null ? userResult.getIsCorrect() : null);

            UserQuestionResult latestResult = userQuestionResultRepository.findTopByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(user.getUserId(), question.getQuestionId());
            questionData.put("isBookmarked", latestResult != null && latestResult.getIsBookmarked());
            questions.add(questionData);
        }
        result.put("questions", questions);

        return result;
    }

    public List<Map<String, Object>> getBookmarkedQuestionsBySubject(Long subjectId, Long userId) {
        List<Map<String, Object>> bookmarkedQuestions = new ArrayList<>();
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId);

        for (QuizSet quizSet : quizSets) {
            List<Question> questions = quizSet.getQuestions();
            for (Question question : questions) {
                UserQuestionResult userQuestionResult = userQuestionResultRepository
                        .findTopByUser_UserIdAndQuestion_QuestionIdAndIsBookmarkedOrderByCreatedAtDesc(userId, question.getQuestionId(), true);
                if (userQuestionResult != null) {
                    Map<String, Object> questionData = new HashMap<>();
                    questionData.put("questionContent", question.getQuestionContent());
                    questionData.put("explanation", question.getExplanation());
                    questionData.put("userSelectedOption", userQuestionResult.getUserOption().getOptionContent());
                    questionData.put("userSelectedOptionCorrect", userQuestionResult.getIsCorrect());

                    List<Map<String, Object>> options = new ArrayList<>();
                    for (Option option : question.getOptions()) {
                        Map<String, Object> optionData = new HashMap<>();
                        optionData.put("optionContent", option.getOptionContent());
                        optionData.put("isCorrect", option.getIsCorrect());
                        options.add(optionData);
                    }
                    questionData.put("options", options);
                    questionData.put("questionId", question.getQuestionId()); // 토글을 위한 ID 추가

                    bookmarkedQuestions.add(questionData);
                }
            }
        }

        return bookmarkedQuestions;
    }

    @Transactional
    public void updateBookmarkStatus(Long userId, Long questionId, boolean isBookmarked) {
        UserQuestionResult userQuestionResult = userQuestionResultRepository
                .findTopByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, questionId);
        if (userQuestionResult != null) {
            userQuestionResult.setIsBookmarked(isBookmarked);
            userQuestionResultRepository.save(userQuestionResult);
        }
    }

    public List<Map<String, Object>> getIncorrectQuestionsBySubject(Long subjectId, Long userId) {
        List<Map<String, Object>> incorrectQuestions = new ArrayList<>();
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId);

        for (QuizSet quizSet : quizSets) {
            List<Question> questions = quizSet.getQuestions();
            for (Question question : questions) {
                // 모든 문제에 대해 결과를 가져오기
                List<UserQuestionResult> userQuestionResults = userQuestionResultRepository
                        .findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, question.getQuestionId());

                // 한번이라도 틀린 적 있는 문제를 필터링
                boolean wasIncorrect = userQuestionResults.stream().anyMatch(result -> !result.getIsCorrect());

                if (wasIncorrect && userQuestionResults.size() >= 3) {
                    // 최근 3번 연속으로 정답을 맞혔는지 확인
                    boolean lastThreeCorrect = userQuestionResults.subList(0, 3).stream().allMatch(UserQuestionResult::getIsCorrect);
                    if (lastThreeCorrect) {
                        continue; // 최근 3번 연속으로 정답을 맞힌 문제는 제외
                    }
                }

                if (wasIncorrect) {
                    // 틀린 내역 중 가장 최근의 기록 찾기
                    Optional<UserQuestionResult> recentIncorrectResult = userQuestionResults.stream()
                            .filter(result -> !result.getIsCorrect())
                            .findFirst();

                    if (recentIncorrectResult.isPresent()) {
                        // 오답 문제 데이터 구성
                        Map<String, Object> questionData = new HashMap<>();
                        questionData.put("questionId", question.getQuestionId());
                        questionData.put("questionContent", question.getQuestionContent());
                        questionData.put("explanation", question.getExplanation());

                        List<Map<String, Object>> options = new ArrayList<>();
                        for (Option option : question.getOptions()) {
                            Map<String, Object> optionData = new HashMap<>();
                            optionData.put("optionContent", option.getOptionContent());
                            optionData.put("isCorrect", option.getIsCorrect());
                            options.add(optionData);
                        }
                        questionData.put("options", options);

                        UserQuestionResult incorrectResult = recentIncorrectResult.get();
                        questionData.put("userSelectedOption", incorrectResult.getUserOption().getOptionContent());
                        questionData.put("userSelectedOptionCorrect", incorrectResult.getIsCorrect());
                        questionData.put("isBookmarked", incorrectResult.getIsBookmarked());

                        incorrectQuestions.add(questionData);
                    }
                }
            }
        }

        return incorrectQuestions;
    }

    public List<Question> getIncorrectQuestions(Long userId, Long subjectId) {
        List<Question> incorrectQuestions = new ArrayList<>();
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId); // 선택된 주제의 QuizSet을 가져옵니다.

        for (QuizSet quizSet : quizSets) {
            List<Question> questions = quizSet.getQuestions();
            for (Question question : questions) {
                // 모든 문제에 대해 결과를 가져오기
                List<UserQuestionResult> userQuestionResults = userQuestionResultRepository
                        .findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, question.getQuestionId());

                // 한번이라도 틀린 적 있는 문제를 필터링
                boolean wasIncorrect = userQuestionResults.stream().anyMatch(result -> !result.getIsCorrect());

                if (wasIncorrect && userQuestionResults.size() >= 3) {
                    // 최근 3번 연속으로 정답을 맞혔는지 확인
                    boolean lastThreeCorrect = userQuestionResults.subList(0, 3).stream().allMatch(UserQuestionResult::getIsCorrect);
                    if (lastThreeCorrect) {
                        continue; // 최근 3번 연속으로 정답을 맞힌 문제는 제외
                    }
                }

                // 오답 문제 추가
                if (wasIncorrect) {
                    incorrectQuestions.add(question);
                }
            }
        }

        return incorrectQuestions;
    }

    public List<Question> getBookmarkedQuestions(Long userId, Long subjectId) {
        List<Question> bookmarkedQuestions = new ArrayList<>();
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId); // 선택된 주제의 QuizSet을 가져옵니다.

        for (QuizSet quizSet : quizSets) {
            List<Question> questions = quizSet.getQuestions();
            for (Question question : questions) {
                // 가장 최근에 푼 문제 내역 중 즐겨찾기 true인 것만 가져오기
                List<UserQuestionResult> userQuestionResults = userQuestionResultRepository
                        .findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, question.getQuestionId());

                if (!userQuestionResults.isEmpty() && userQuestionResults.get(0).getIsBookmarked()) {
                    bookmarkedQuestions.add(question);
                }
            }
        }

        return bookmarkedQuestions;
    }

    public List<Question> getCorrectQuestions(Long userId, Long subjectId) {
        List<Question> correctQuestions = new ArrayList<>();
        List<QuizSet> quizSets = quizSetRepository.findBySubject_SubjectId(subjectId); // 선택된 주제의 QuizSet을 가져옵니다.

        for (QuizSet quizSet : quizSets) {
            List<Question> questions = quizSet.getQuestions();
            for (Question question : questions) {
                // 모든 문제에 대해 결과를 가져오기
                List<UserQuestionResult> userQuestionResults = userQuestionResultRepository
                        .findByUser_UserIdAndQuestion_QuestionIdOrderByCreatedAtDesc(userId, question.getQuestionId());

                boolean wasIncorrect = userQuestionResults.stream().anyMatch(result -> !result.getIsCorrect());

                if (!wasIncorrect) {
                    correctQuestions.add(question);
                } else if (wasIncorrect && userQuestionResults.size() >= 3) {
                    boolean lastThreeCorrect = userQuestionResults.subList(0, 3).stream().allMatch(UserQuestionResult::getIsCorrect);
                    if (lastThreeCorrect) {
                        correctQuestions.add(question);
                    }
                }
            }
        }

        return correctQuestions;
    }

    public Question getRandomReviewQuestion(Long userId, Long subjectId) {
        List<Question> incorrectQuestions = getIncorrectQuestions(userId, subjectId);
        List<Question> bookmarkedQuestions = getBookmarkedQuestions(userId, subjectId);
        List<Question> correctQuestions = getCorrectQuestions(userId, subjectId);

        List<Question> allQuestions = new ArrayList<>();

        allQuestions.addAll(selectRandomQuestions(incorrectQuestions, 40));
        allQuestions.addAll(selectRandomQuestions(bookmarkedQuestions, 40));
        allQuestions.addAll(selectRandomQuestions(correctQuestions, 20));

        if (allQuestions.isEmpty()) {
            return null;
        }

        Random random = new Random();
        return allQuestions.get(random.nextInt(allQuestions.size()));
    }

    private List<Question> selectRandomQuestions(List<Question> questions, int percentage) {
        if (questions.isEmpty()) {
            return Collections.emptyList();
        }

        int count = (int) Math.ceil((percentage / 100.0) * questions.size());
        Collections.shuffle(questions);

        return questions.subList(0, Math.min(count, questions.size()));
    }

    @Transactional
    public UserQuestionResult saveReviewQuestionResult(Long userId, Long questionId, Long optionId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found"));
        Question question = questionRepository.findById(questionId).orElseThrow(() -> new EntityNotFoundException("Question not found"));
        Option option = optionRepository.findById(optionId).orElseThrow(() -> new EntityNotFoundException("Option not found"));

        boolean isCorrect = option.getIsCorrect();

        UserQuestionResult userQuestionResult = new UserQuestionResult();
        userQuestionResult.setUser(user);
        userQuestionResult.setQuestion(question);
        userQuestionResult.setUserOption(option);
        userQuestionResult.setIsCorrect(isCorrect);
        userQuestionResult.setIsBookmarked(false); // 기본값
        userQuestionResult.setCreatedAt(LocalDateTime.now());

        return userQuestionResultRepository.save(userQuestionResult);
    }

    // 삭제 로직 + 점수 재계산
// 삭제 로직 + 점수 재계산
    @Transactional
    public void deleteQuestionById(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question not found"));

        QuizSet quizSet = question.getQuizSet();
        quizSet.getQuestions().remove(question); // QuizSet에서 Question 제거

        questionRepository.delete(question); // Question 삭제

        // 모든 질문이 삭제된 경우 퀴즈 세트 삭제
        if (quizSet.getQuestions().isEmpty()) {
            quizSetRepository.delete(quizSet);
        } else {
            // 관련된 UserQuizsetAttempt를 가져와서 점수 재계산
            List<UserQuizsetAttempt> attempts = userQuizsetAttemptRepository.findByQuizSet_QuizsetId(quizSet.getQuizsetId());
            for (UserQuizsetAttempt attempt : attempts) {
                updateQuizSetScore(attempt);
            }

            quizSetRepository.save(quizSet); // QuizSet 업데이트
        }
    }
}
