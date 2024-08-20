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
function fetchQuizSets(subjectId) {
    return fetch(`/api/quiz/sets/${subjectId}`)
        .then(response => response.json())
        .then(quizSets => {
            const quizList = document.getElementById('question-list');
            quizList.innerHTML = '';
            quizSets.reverse().forEach((quizSet, index) => {
                const quizItem = document.createElement('div');
                quizItem.className = 'quiz-set-item';
                quizItem.dataset.quizSetId = quizSet.quizsetId;
                const scoreText = quizSet.score === null ? "  -  진행 중" : ` -  점수 :  ${quizSet.score} 점`;
                quizItem.innerHTML = `
                    <p>세트 ${quizSets.length - index} ${scoreText}</p>
                    <button class="options-button" onclick="showQuizSetOptions(${quizSet.quizsetId})">⋮</button>
                `;
                quizItem.onclick = function() {
                    toggleQuizSetSelection(quizSet.quizsetId, quizItem);
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
    if (selectedQuizSetId === quizSetId) {
        element.classList.remove('selected');
        selectedQuizSetId = null;
        clearMainContent();
    } else {
        if (selectedQuizSetId !== null) {
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
        disableButtons();
        clearMainContent();
    } else {
        if (selectedSubjectId !== null) {
            const previousSelected = document.querySelector(`.subject-item[data-subject-id="${selectedSubjectId}"]`);
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
        }
        element.classList.add('selected');
        selectedSubjectId = subjectId;
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
