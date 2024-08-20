var currentQuestionIndex = 0;
var filteredQuizData = [];
var favorites = new Set();
var selectedAnswers = {}; // 각 질문에 대한 선택된 답안을 저장하는 객체

// 로딩 표시 요소 추가
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.innerHTML = '문제를 생성하는 중...';
loadingIndicator.style.display = 'none';
document.body.appendChild(loadingIndicator);

function startOrContinueQuiz(quizSetId) {
    activeMenu = 'quizSet';
    console.log(`Starting or continuing quiz for quizSetId: ${quizSetId}`);
    fetch(`/api/quiz/attempt/${quizSetId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('퀴즈 시도 정보를 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(attempt => {
            console.log('Quiz attempt fetched:', attempt);
            currentAttemptId = attempt.attemptId;
            selectedQuizSetId = quizSetId;
            if (attempt.complete) {
                fetchQuizSetResult(quizSetId); // 퀴즈가 완료된 경우 결과를 가져와서 표시
            } else {
                currentQuestionId = attempt.currentQuestionId; // 첫 질문의 ID 설정
                fetchQuizQuestions(quizSetId); // 퀴즈 세트의 문제들을 가져옴
            }
        })
        .catch(error => {
            console.error('Error starting or continuing quiz:', error);
            alert('퀴즈를 시작하거나 이어서 진행하는데 오류가 발생했습니다.');
        });
}

// 선택된 퀴즈 세트의 문제들을 가져오는 함수
function fetchQuizQuestions(quizSetId) {
    fetch(`/api/quiz/set/${quizSetId}/questions`)
        .then(response => {
            if (!response.ok) {
                throw new Error('퀴즈 세트의 문제들을 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(questions => {
            filteredQuizData = questions;
            currentQuestionIndex = 0;
            showCurrentQuestion();
        })
        .catch(error => {
            console.error('Error fetching quiz questions:', error);
            alert('퀴즈 세트의 문제들을 가져오는데 오류가 발생했습니다.');
        });
}

document.querySelectorAll('.quiz-set-item').forEach(item => {
    item.addEventListener('click', function() {
        const quizSetId = this.dataset.quizSetId;
        startOrContinueQuiz(quizSetId);
    });
});

// 퀴즈 개수를 선택한 후 확인 버튼을 눌렀을 때 호출
function confirmQuiz() {
    var selectedCount = document.querySelector('input[name="quiz-count"]:checked').value;

    // 로딩 표시를 보이도록 설정
    loadingIndicator.style.display = 'block';
    toggleModal('quiz-modal'); // 팝업 닫기

    // 주어진 주제 ID를 이용해 서버에 퀴즈 요청
    fetch(`/api/quiz/generate?subjectId=${selectedSubjectId}&numberOfQuestions=${selectedCount}`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('퀴즈 생성에 실패했습니다.');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.message);
            }
            filteredQuizData = data;
            currentQuestionIndex = 0;
            selectedAnswers = {}; // 새로운 퀴즈를 시작할 때 선택된 답안 초기화
            loadingIndicator.style.display = 'none'; // 로딩 표시 숨김

            // 기존 선택된 세트 해제
            if (selectedQuizSetId !== null) {
                const previousSelected = document.querySelector(`.quiz-set-item[data-quiz-set-id="${selectedQuizSetId}"]`);
                if (previousSelected) {
                    previousSelected.classList.remove('selected');
                }
                clearMainContent(); // 메인 컨텐츠 초기화
                selectedQuizSetId = null;
            }

            // 새로 생성된 세트 선택
            const newQuizSetId = data.quizsetId;
            fetchQuizSets(selectedSubjectId).then(() => {
                const newQuizItem = document.querySelector(`.quiz-set-item[data-quiz-set-id="${newQuizSetId}"]`);
                if (newQuizItem) {
                    newQuizItem.classList.add('selected');
                    selectedQuizSetId = newQuizSetId;
                    startOrContinueQuiz(newQuizSetId)
                }
            });
        })
        .catch(error => {
            console.error('Error generating quiz:', error);
            loadingIndicator.style.display = 'none';
            // 오류 발생 시 기존 선택된 세트 해제
            if (selectedQuizSetId !== null) {
                const previousSelected = document.querySelector(`.quiz-set-item[data-quiz-set-id="${selectedQuizSetId}"]`);
                if (previousSelected) {
                    previousSelected.classList.remove('selected');
                }
                selectedQuizSetId = null;
            }
            document.getElementById('content-display').innerHTML = '문제를 생성하는데 오류가 발생했습니다.\n문제 풀기 버튼을 다시 눌러주세요.';
        });
}

// 현재 문제를 표시하는 함수
function showCurrentQuestion() {
    if (filteredQuizData.length === 0) {
        fetchQuizSetResult(selectedQuizSetId);
    } else {
        var quizDisplay = document.getElementById('content-display');
        var currentQuestion = filteredQuizData.find(question => question.questionId === currentQuestionId);

        if (!currentQuestion) {
            console.error('Current question not found:', currentQuestionId);
            return;
        }

        var html = '<div class="quiz-item">';
        html += '<div class="question-number">';
        html += '문제';
        html += '<span class="favorite" onclick="toggleFavorite(' + currentQuestionIndex + ')">';
        html += favorites.has(currentQuestionIndex) ? '&#9733;' : '&#9734;'; // 별표(★) 또는 빈 별표(☆)
        html += '</span>';
        html += '</div>';
        html += '<div class="question-divider"></div>';
        html += '<div class="question-name">' + currentQuestion.questionContent + '</div>';

        // 보기 출력
        currentQuestion.options.forEach(function(option) {
            var isChecked = selectedAnswers[currentQuestionIndex] === option.optionId ? 'checked' : '';
            html += '<div class="radio-buttons">';
            html += '<label><input type="radio" name="selected-question-' + currentQuestionIndex + '" value="' + option.optionId + '" ' + isChecked + ' onchange="selectAnswer(' + currentQuestionIndex + ', ' + option.optionId + ')">' + option.optionContent + '</label>';
            html += '</div>';
        });

        html += '</div>';

        // 네비게이션 버튼
        html += '<div class="navigation-buttons">';
        if (currentQuestionIndex < filteredQuizData.length - 1) {
            html += '<button onclick="submitAnswer()">다음</button>';
        } else {
            html += '<button onclick="completeQuiz()">완료</button>';
        }
        html += '</div>';

        quizDisplay.innerHTML = html;
    }
}

// 답안을 선택했을 때 호출
function selectAnswer(questionIndex, optionId) {
    selectedAnswers[questionIndex] = optionId;
}

// 답안을 제출하는 함수
function submitAnswer() {
    const selectedOption = document.querySelector('input[name="selected-question-' + currentQuestionIndex + '"]:checked');

    if (!selectedOption) {
        alert('정답을 선택해 주세요.');
        return;
    }

    // 선택된 답안을 서버에 기록
    fetch(`/api/quiz/attempt/${currentAttemptId}/answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            optionId: selectedOption.value,
            isBookmarked: favorites.has(currentQuestionIndex)
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('정답을 제출하는데 실패했습니다.');
            }
            return response.json(); // 응답을 JSON 형태로 파싱
        })
        .then(attempt => {
            console.log('Attempt response:', attempt);
            if (attempt.isComplete) {
                alert('퀴즈를 완료했습니다!');
                fetchQuizSetResult(selectedQuizSetId);
            } else {
                favorites.delete(currentQuestionIndex);
                currentQuestionId = attempt.currentQuestionId;
                currentQuestionIndex++;
                showCurrentQuestion();
            }
        })
        .catch(error => {
            console.error('Error submitting answer:', error);
            alert('정답을 제출하는데 오류가 발생했습니다.');
        });
}

// 퀴즈를 완료하는 함수
function completeQuiz() {
    const selectedOption = document.querySelector('input[name="selected-question-' + currentQuestionIndex + '"]:checked');

    if (!selectedOption) {
        alert('정답을 선택해 주세요.');
        return;
    }

    // 선택된 답안을 서버에 기록
    fetch(`/api/quiz/attempt/${currentAttemptId}/answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            optionId: selectedOption.value,
            isBookmarked: favorites.has(currentQuestionIndex)
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('정답을 제출하는데 실패했습니다.');
            }
            return response.json(); // 응답을 JSON 형태로 파싱
        })
        .then(attempt => {
            alert('퀴즈를 완료했습니다!');
            fetchQuizSetResult(selectedQuizSetId);
        })
        .catch(error => {
            console.error('Error submitting answer:', error);
            alert('정답을 제출하는데 오류가 발생했습니다.');
        });
}

function fetchQuizSetResult(quizSetId) {
    fetch(`/api/quiz/set/${quizSetId}/result`)
        .then(response => {
            if (!response.ok) {
                throw new Error('퀴즈 세트 결과를 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            showQuizSetResult(result);
        })
        .catch(error => {
            console.error('Error fetching quiz set result:', error);
            alert('퀴즈 세트 결과를 가져오는데 오류가 발생했습니다.');
        });
}

// TODO : 문제 개별 수정 요청 버튼 + 모달창, 개별 문제 삭제
function showQuizSetResult(result) {
    var quizDisplay = document.getElementById('content-display');
    var html = `<div class="quiz-result"><h3>${result.score} 점 / 100 점</h3></div>`;
    result.questions.forEach((question, index) => {
        console.log(`Question ${index + 1}:`, question); // 로그 추가
        html += '<div class="quiz-item">';
        html += `<div class="question-number">문제 ${index + 1}`;
        html += `<div class="question-actions">`;
        html += `<button onclick="editQuestion(${question.questionId})" class="edit-quiz-button"><i class="fas fa-edit"></i> 수정</button>`;
        html += `<button onclick="deleteQuestion(${question.questionId})" class="delete-quiz-button"><i class="fas fa-trash"></i> 삭제</button>`;
        html += `<span class="favorite" onclick="toggleBookmark(${question.questionId}, ${question.isBookmarked})">${question.isBookmarked ? '&#9733;' : '&#9734;'}</span>`;
        html += `</div></div>`;

        html += '<div class="question-divider"></div>';
        html += `<div class="question-name">${question.questionContent}</div>`;

        // 보기 출력
        question.options.forEach((option, optionIndex) => {
            var optionClass = option.isCorrect ? 'correct-option' : '';
            if (!option.isCorrect && option.optionContent === question.userSelectedOption) {
                optionClass = 'wrong-option';
            }
            var optionNumber = (optionIndex + 1) + ')'; // 1), 2), 3), 4) 로 변환
            html += `<div class="radio-buttons ${optionClass}">`;
            html += `<label>${optionNumber}) ${option.optionContent}</label>`;
            html += '</div>';
        });
        html += `<div class="explanation">해설: ${question.explanation}</div>`;
        html += '</div>';
    });

    quizDisplay.innerHTML = html;
}

// 즐겨찾기 토글 기능
function toggleFavorite(questionIndex) {
    if (favorites.has(questionIndex)) {
        favorites.delete(questionIndex);
    } else {
        favorites.add(questionIndex);
    }
    showCurrentQuestion(); // 업데이트된 별표 표시를 위해 현재 문제를 다시 렌더링
}

document.getElementById('summary-button').addEventListener('click', function() {
    activeMenu = 'summary';
    clearSelectedQuizSet();
    generateAndFetchSummary(selectedSubjectId);
});

document.getElementById('review-button').addEventListener('click', function() {
    activeMenu = 'review';
    clearSelectedQuizSet();
    fetchReviewQuestion(selectedSubjectId);
});

document.getElementById('favorites-button').addEventListener('click', function() {
    activeMenu = 'favorites';
    clearSelectedQuizSet();
    findFavorites();
});

document.getElementById('incorrect-button').addEventListener('click', function() {
    activeMenu = 'incorrect';
    clearSelectedQuizSet();
    showIncorrectQuestions()
});

function clearSelectedQuizSet() {
    if (selectedQuizSetId !== null) {
        const previousSelected = document.querySelector(`.quiz-set-item[data-quiz-set-id="${selectedQuizSetId}"]`);
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        selectedQuizSetId = null;
        clearMainContent();
    }
}

// 즐겨찾기 기능
function findFavorites() {
    if (selectedSubjectId === null) {
        alert('주제를 먼저 선택하세요.');
        return;
    }

    fetch(`/api/quiz/bookmarked/${selectedSubjectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('즐겨찾기 문제들을 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            showBookmarkedQuestions(result);
        })
        .catch(error => {
            console.error('Error fetching bookmarked questions:', error);
            alert('즐겨찾기 문제들을 가져오는데 오류가 발생했습니다.');
        });
}

function showBookmarkedQuestions(questions) {
    var quizDisplay = document.getElementById('content-display');
    var html = '<div class="quiz-result"><h3>즐겨찾기</h3></div>';
    questions.forEach((question, index) => {
        html += '<div class="quiz-item">';
        html += '<div class="question-header">';
        html += `<div class="question-number">문제 ${index + 1}`;
        html += `<span class="favorite" onclick="toggleBookmark(${question.questionId}, ${true})">&#9733;</span></div>`;
        html += '</div>';
        html += '<div class="question-divider"></div>';
        html += `<div class="question-name">${question.questionContent}</div>`;

        question.options.forEach((option, optionIndex) => {
            var optionClass = option.isCorrect ? 'correct-option' : '';
            if (!option.isCorrect && option.optionContent === question.userSelectedOption) {
                optionClass = 'wrong-option';
            }
            var optionNumber = (optionIndex + 1) + ')'; // 1), 2), 3), 4) 로 변환
            html += `<div class="radio-buttons ${optionClass}">`;
            html += `<label>${optionNumber} ${option.optionContent}</label>`;
            html += '</div>';
        });

        html += `<div class="explanation">해설: ${question.explanation}</div>`;
        html += '</div>';
    });

    quizDisplay.innerHTML = html;
}

function generateAndFetchSummary(subjectId) {
    fetch(`/api/subjects/${subjectId}/generate-summary`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('요약을 생성하는데 실패했습니다.');
            }

            // 응답의 Content-Type 헤더를 확인하여 JSON 또는 텍스트로 처리
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json(); // JSON 응답일 경우
            } else {
                return response.text(); // 텍스트 응답일 경우
            }
        })
        .then(data => {
            console.log('Server response:', data);

            // 텍스트 응답일 경우 그대로 표시
            if (typeof data === 'string') {
                displaySummary(data);
            } else if (data && typeof data === 'object' && data.summary) {
                displaySummary(data.summary);
            } else {
                throw new Error('생성된 요약을 가져오는데 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error generating summary:', error);
            alert('요약을 생성하는데 오류가 발생했습니다.');
        });
}

function displaySummary(summary) {
    var contentDisplay = document.getElementById('content-display');
    var html = `<div class="summary-content"><h3>요약</h3><p>${summary}</p></div>`;
    contentDisplay.innerHTML = html;
    contentDisplay.scrollTop = 0;
}
