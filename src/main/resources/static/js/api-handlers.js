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
