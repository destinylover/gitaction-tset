let selectedSubjectId = null;
let selectedQuizSetId = null;
let currentAttemptId = null;
let currentQuestionId = null;
let activeMenu = '';

// 로그아웃 버튼 클릭 이벤트 리스너
document.getElementById('logout-button').addEventListener('click', function() {
    fetch('/api/users/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                alert('로그아웃에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
});

// 파일 업로드 폼 제출 시 이벤트 리스너
document.getElementById('file-upload-form').addEventListener('submit', function(event) {
    event.preventDefault(); // 기본 폼 제출 동작 방지

    const formData = new FormData(this);

    fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('파일이 성공적으로 업로드되었습니다.');
                addSubjectToList(data.subjectId, data.subjectName);
                toggleModal('upload-modal');
                document.getElementById('file-upload-form').reset();
                selectSubject(data.subjectId);
            } else {
                alert('파일 업로드에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('파일 업로드 중 오류가 발생했습니다.');
        });
});

// 주제를 선택하는 함수
function selectSubject(subjectId) {
    const subjectItems = document.querySelectorAll('.subject-item');
    subjectItems.forEach(item => {
        if (item.dataset.subjectId === subjectId.toString()) {
            item.classList.add('selected');
            enableButtons();
        } else {
            item.classList.remove('selected');
        }
    });
    selectedSubjectId = subjectId;
    showSummary(subjectId);
    fetchQuizSets(subjectId);
}

// 주제 ID를 이용해 해당 주제의 퀴즈 세트를 가져오는 함수
// TODO 퀴즈 세트 제목 옆에 몇 점인지도 같이 표기.
function fetchQuizSets(subjectId) {
    return fetch(`/api/quiz/sets/${subjectId}`)
        .then(response => response.json())      // 응답을 JSON 으로 변환
        .then(quizSets => {
            const quizList = document.getElementById('question-list');
            quizList.innerHTML = '';                                      // 기존 리스트 초기화
            quizSets.reverse().forEach((quizSet, index) => {        // 최신 퀴즈 세트부터 표시
                const quizItem = document.createElement('div');
                quizItem.className = 'quiz-set-item';
                quizItem.dataset.quizSetId = quizSet.quizsetId;
                const scoreText = quizSet.score === null ? "  -  진행 중" : ` -  점수 :  ${quizSet.score} 점`;
                quizItem.innerHTML = `
                    <p>세트 ${quizSets.length - index} ${scoreText}</p>
                    <button class="options-button" onclick="showQuizSetOptions(${quizSet.quizsetId})">⋮</button>
                `;
                quizItem.onclick = function() {
                    toggleQuizSetSelection(quizSet.quizsetId, quizItem);    // 퀴즈 세트 선택 토글
                };
                quizList.appendChild(quizItem);
            });
        })
        .catch(error => {
            console.error('Error fetching quiz sets:', error);
        });
}

// 퀴즈 세트를 선택하거나 선택 해제하는 함수
function toggleQuizSetSelection(quizSetId, element) {
    if (selectedQuizSetId === quizSetId) {      // 이미 선택된 세트를 다시 선택한 경우
        element.classList.remove('selected');   // 선택 해제
        selectedQuizSetId = null;
        clearMainContent();
    } else {
        if (selectedQuizSetId !== null) {       // 다른 세트가 선택된 경우
            const previousSelected = document.querySelector(`.quiz-set-item[data-quiz-set-id="${selectedQuizSetId}"]`);
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
        }
        element.classList.add('selected');
        selectedQuizSetId = quizSetId;
        startOrContinueQuiz(quizSetId);
    }
}

function showQuizSetOptions(quizSetId) {
    if (confirm('문제 세트를 삭제하시겠습니까?')) {
        deleteQuizSet(quizSetId);
    }
}

function deleteQuizSet(quizSetId) {
    fetch(`/api/quiz/set/${quizSetId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                const quizSetItem = document.querySelector(`.quiz-set-item[data-quiz-set-id="${quizSetId}"]`);
                if (quizSetItem) {
                    quizSetItem.remove();
                    fetchQuizSets(selectedSubjectId);
                }
            } else {
                alert('문제 세트 삭제에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error deleting quiz set:', error);
            alert('문제 세트 삭제 중 오류가 발생했습니다.');
        });
}

function addSubjectToList(subjectId, subjectName) {
    const subjectList = document.querySelector('.subject-list');
    const newSubject = document.createElement('div');
    newSubject.className = 'subject-item';
    newSubject.innerHTML = `
        <span class="subject-name">${subjectName}</span>
        <button class="options-button" onclick="showOptions(${subjectId})">⋮</button>
    `;
    newSubject.dataset.subjectId = subjectId;
    newSubject.querySelector('.subject-name').onclick = function() {
        toggleSubjectSelection(subjectId, newSubject);
    };
    subjectList.insertBefore(newSubject, subjectList.firstChild);
}

window.onload = function() {
    fetch('/api/subjects')
        .then(response => response.json())
        .then(subjects => {
            const subjectList = document.querySelector('.subject-list');
            subjects.reverse().forEach(subject => {
                const newSubject = document.createElement('div');
                newSubject.className = 'subject-item';
                newSubject.innerHTML = `
                    <span class="subject-name">${subject.subjectName}</span>
                    <button class="options-button" onclick="showOptions(${subject.subjectId})">⋮</button>
                `;
                newSubject.dataset.subjectId = subject.subjectId;
                newSubject.querySelector('.subject-name').onclick = function() {
                    toggleSubjectSelection(subject.subjectId, newSubject);
                };
                subjectList.appendChild(newSubject);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

function showOptions(subjectId) {
    document.getElementById('edit-subject-id').value = subjectId;
    document.getElementById('edit-subject-name').value = '';
    toggleModal('edit-modal');
}


function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.style.display === "block") {
        modal.style.display = "none";
    } else {
        modal.style.display = "block";
    }
}

// 주제 이름을 변경하는 폼의 제출 이벤트 리스너
document.getElementById('edit-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const subjectId = document.getElementById('edit-subject-id').value;
    const newName = document.getElementById('edit-subject-name').value;

    fetch(`/api/subjects/${subjectId}/rename`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newName })
    })
        .then(response => {
            if (response.ok) {
                const subjectItem = document.querySelector(`.subject-item[data-subject-id="${subjectId}"] .subject-name`);
                subjectItem.textContent = newName;
                toggleModal('edit-modal');
            } else {
                alert('주제 이름 변경에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('주제 이름 변경 중 오류가 발생했습니다.');
        });
});

// 주제를 삭제하는 함수
function deleteSubject() {
    const subjectId = document.getElementById('edit-subject-id').value;

    fetch(`/api/subjects/${subjectId}/delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                const subjectItem = document.querySelector(`.subject-item[data-subject-id="${subjectId}"]`);
                subjectItem.remove();
                toggleModal('edit-modal');
                // 선택된 주제가 삭제된 경우 버튼 비활성화
                if (!document.querySelector('.subject-item.selected')) {
                    disableButtons();
                    clearMainContent();
                }
            } else {
                alert('주제 삭제에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('주제 삭제 중 오류가 발생했습니다.');
        });
}

// 주제 선택 및 해제 기능
function toggleSubjectSelection(subjectId, element) {
    if (selectedSubjectId === subjectId) {
        element.classList.remove('selected');
        selectedSubjectId = null;
        // 비활성화 처리
        disableButtons();
        clearMainContent();
    } else {
        // 기존 선택된 주제 해제
        if (selectedSubjectId !== null) {
            const previousSelected = document.querySelector(`.subject-item[data-subject-id="${selectedSubjectId}"]`);
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
        }
        element.classList.add('selected');
        selectedSubjectId = subjectId;
        // 활성화 처리
        enableButtons();
        showSummary(subjectId);
        fetchQuizSets(subjectId);
    }
}

// 버튼을 활성화하는 함수
function enableButtons() {
    document.querySelectorAll('.action-buttons button:not(.upload-button)').forEach(button => {
        button.style.display = 'inline-block';
    });
    document.querySelector('.sidebar-second').style.display = 'flex'; // 문제 모음 sidebar 표시
    document.querySelector('.sidebar-first .sidebar-footer .logout-button').style.display = 'block';
}

// 버튼을 비활성화하는 함수
function disableButtons() {
    document.querySelectorAll('.action-buttons button:not(.upload-button)').forEach(button => {
        button.style.display = 'none';
    });
    document.querySelector('.sidebar-second').style.display = 'none'; // 문제 모음 sidebar 숨김
    document.querySelector('.sidebar-first .sidebar-footer .logout-button').style.display = 'block'; // 로그아웃 버튼 유지
}

// 메인 콘텐츠 초기화하는 함수
function clearMainContent() {
    document.getElementById('content-display').innerHTML = '';
}

// 주제 선택 시 요약 내용을 보여주는 함수
function showSummary() {
    if (selectedSubjectId === null) {
        console.error('No subject selected');
        return;
    }

    fetch(`/api/subjects/${selectedSubjectId}/summary`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text(); // response.json() 대신 response.text() 사용
        })
        .then(data => {
            const contentDisplay = document.getElementById('content-display');
            contentDisplay.innerHTML = `<h3>요약</h3><p>${data}</p>`;
        })
        .catch(error => {
            console.error('Error fetching summary:', error);
        });
}

// 페이지 로드 시 버튼 비활성화
disableButtons();

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
    showSummary(selectedSubjectId);
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


function toggleBookmark(questionId, isBookmarked) {
    fetch('/api/quiz/bookmark/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            questionId: questionId,
            isBookmarked: !isBookmarked
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('즐겨찾기 상태를 업데이트하는데 실패했습니다.');
            }
            // 문제 푼 내역 또는 즐겨찾기 목록을 다시 불러옵니다.
            if (selectedQuizSetId) {
                fetchQuizSetResult(selectedQuizSetId);
            } else if (activeMenu === 'incorrect') {
                showIncorrectQuestions();
            } else if (activeMenu === 'review') {
                fetchReviewQuestion(selectedSubjectId);
            } else {
                findFavorites();
            }
        })
        .catch(error => {
            console.error('Error updating bookmark status:', error);
            alert('즐겨찾기 상태를 업데이트하는데 오류가 발생했습니다.');
        });
}

// 오답 기능
function showIncorrectQuestions() {
    if (selectedSubjectId === null) {
        alert('주제를 먼저 선택하세요.');
        return;
    }

    fetch(`/api/quiz/incorrect/${selectedSubjectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('오답 문제들을 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            displayIncorrectQuestions(result);
        })
        .catch(error => {
            console.error('Error fetching incorrect questions:', error);
            alert('오답 문제들을 가져오는데 오류가 발생했습니다.');
        });
}

function displayIncorrectQuestions(questions) {
    var quizDisplay = document.getElementById('content-display');
    var html = '<div class="quiz-result"><h3>오답</h3></div>';
    questions.forEach((question, index) => {
        console.log(`Question ${index + 1}:`, question); // 로그 추가
        html += '<div class="quiz-item">';
        html += '<div class="question-header">';
        html += `<div class="question-number">문제 ${index + 1}`;
        html += `<span class="favorite" onclick="toggleBookmark(${question.questionId}, ${question.isBookmarked})">${question.isBookmarked ? '&#9733;' : '&#9734;'}</span></div>`;
        html += '</div>';
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
            html += `<label>${optionNumber} ${option.optionContent}</label>`;
            html += '</div>';
        });

        html += `<div class="explanation">해설: ${question.explanation}</div>`;
        html += '</div>';
    });

    quizDisplay.innerHTML = html;
}

// 복습 기능
function fetchReviewQuestion(subjectId) {
    fetch(`/api/quiz/review/${subjectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('복습 문제를 가져오는데 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            displayReviewQuestion(result);
        })
        .catch(error => {
            console.error('Error fetching review question:', error);
            alert('복습 문제를 가져오는데 오류가 발생했습니다.');
        });
}

function displayReviewQuestion(question) {
    var quizDisplay = document.getElementById('content-display');
    var html = '<div class="quiz-item">';
    html += '<div class="question-header">';
    html += `<div class="question-number">복습 문제`;
    html += `<span class="favorite" onclick="toggleBookmark(${question.questionId}, ${question.isBookmarked})">${question.isBookmarked ? '&#9733;' : '&#9734;'}</span></div>`;
    html += '</div>';
    html += '<div class="question-divider"></div>';
    html += `<div class="question-name">${question.questionContent}</div>`;

    question.options.forEach((option, optionIndex) => {
        var optionNumber = (optionIndex + 1) + ')'; // 1), 2), 3), 4) 로 변환
        html += `<div class="radio-buttons">`;
        html += `<label><input type="radio" name="selected-question" value="${option.optionId}">${optionNumber} ${option.optionContent}</label>`;
        html += '</div>';
    });

    html += '<div class="navigation-buttons">';
    html += '<button onclick="submitReviewAnswer()">제출</button>';
    html += '</div>';
    html += '</div>';

    quizDisplay.innerHTML = html;
}

function submitReviewAnswer() {
    const selectedOption = document.querySelector('input[name="selected-question"]:checked');

    if (!selectedOption) {
        alert('정답을 선택해 주세요.');
        return;
    }

    const questionId = document.querySelector('.favorite').getAttribute('onclick').match(/\d+/)[0];
    const optionId = selectedOption.value;

    fetch('/api/quiz/attempt/review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            questionId: questionId,
            optionId: optionId
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('정답을 제출하는데 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            displayReviewResult(result);
        })
        .catch(error => {
            console.error('Error submitting review answer:', error);
            alert('정답을 제출하는데 오류가 발생했습니다.');
        });
}

function displayReviewResult(result) {
    var quizDisplay = document.getElementById('content-display');
    var html = '<div class="quiz-item">';
    html += '<div class="question-header">';
    html += `<div class="question-number">복습 문제`;
    html += `<span class="favorite" onclick="toggleBookmark(${result.questionId}, ${result.isBookmarked})">${result.isBookmarked ? '&#9733;' : '&#9734;'}</span></div>`;
    html += '</div>';
    html += '<div class="question-divider"></div>';
    html += `<div class="question-name">${result.questionContent}</div>`;

    result.options.forEach((option, optionIndex) => {
        var optionClass = option.isCorrect ? 'correct-option' : '';
        if (!option.isCorrect && option.optionId === result.userSelectedOptionId) {
            optionClass = 'wrong-option';
        }
        var optionNumber = (optionIndex + 1) + ')'; // 1), 2), 3), 4) 로 변환
        html += `<div class="radio-buttons ${optionClass}">`;
        html += `<label>${optionNumber} ${option.optionContent}</label>`;
        html += '</div>';
    });

    html += `<div class="explanation">해설: ${result.explanation}</div>`;
    html += '<div class="navigation-buttons">';
    html += '<button onclick="fetchReviewQuestion(selectedSubjectId)">다음</button>';
    html += '</div>';
    html += '</div>';

    quizDisplay.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
    var dropArea = document.getElementById('drop-area');

    // 드래그 오버 시 기본 행동을 방지
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 드래그 하고 있는 요소가 drop-area에 들어오고 나갈 때 스타일 변경
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dropArea.classList.remove('highlight');
    }

    // 파일을 드롭했을 때의 이벤트 핸들러
    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        var dt = e.dataTransfer;
        var files = dt.files;

        handleFiles(files);
    }

    function handleFiles(files) {
        document.getElementById('file-input').files = files;
    }
});