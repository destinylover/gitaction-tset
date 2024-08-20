function editQuestion(questionId) {
    // 수정 모달을 열고, 현재 질문 ID를 저장
    toggleModal('edit-quiz-modal');
    document.getElementById('edit-reason').dataset.questionId = questionId;
}

// TODO : 스프링 MVC 구현
function submitEditRequest() {
    const questionId = document.getElementById('edit-reason').dataset.questionId;
    const reason = document.getElementById('edit-reason').value;

    fetch(`/api/questions/${questionId}/edit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason }),
    })
        .then(response => {
            if (response.ok) {
                alert('수정 요청이 제출되었습니다.');
                toggleModal('edit-quiz-modal');
            } else {
                alert('수정 요청 제출에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('수정 요청 제출 중 오류가 발생했습니다.');
        });
}

function deleteQuestion(questionId) {
    if (confirm('정말로 이 문제를 삭제하시겠습니까?')) {
        fetch(`/api/quiz/questions/${questionId}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (response.ok) {
                    alert('문제가 삭제되었습니다.');
                    location.reload(); // 페이지 새로고침
                } else {
                    alert('문제 삭제에 실패했습니다.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('문제 삭제 중 오류가 발생했습니다.');
            });
    }
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

// 모달 열기와 관련된 함수를 분리해서 더 명확하게 관리
function openEditModal(questionId) {
    document.getElementById('edit-reason').dataset.questionId = questionId;
    toggleModal('edit-quiz-modal');
}

function closeEditModal() {
    document.getElementById('edit-reason').value = '';
    document.getElementById('edit-reason').removeAttribute('data-question-id');
    toggleModal('edit-quiz-modal');
}

