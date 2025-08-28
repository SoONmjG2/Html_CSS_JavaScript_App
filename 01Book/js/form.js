// 전역 변수
const API_BASE_URL = 'http://localhost:8080';
let editingBookId = null;

// DOM 요소 참조
const bookForm = document.getElementById('bookForm');
const bookTableBody = document.getElementById('bookTableBody');
const submitButton = bookForm.querySelector("button[type='submit']");
const cancelButton = bookForm.querySelector(".cancel-btn");
const formError = document.getElementById("formError");

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료');
    loadBooks();
});

// 폼 제출 
bookForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // 폼 데이터 수집
    const formData = new FormData(bookForm);
    const bookData = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        isbn: formData.get('isbn').trim(),
        price: formData.get('price') ? parseInt(formData.get('price')) : null,
        publishDate: formData.get('publishDate') || null,
        detail: {
            description: formData.get('description').trim(),
            language: formData.get('language').trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            publisher: formData.get('publisher').trim(),
            coverImageUrl: formData.get('coverImageUrl').trim(),
            edition: formData.get('edition').trim()
        }
    };

    // 유효성 검사
    if (!validateBook(bookData)) {
        return;
    }

    if (editingBookId) {
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
});

// 도서 데이터 유효성 검사
function validateBook(book) {
    // 필수 필드 검사
    if (!book.title) {
        alert('제목을 입력해주세요.');
        return false;
    }
    
    if (!book.author) {
        alert('저자를 입력해주세요.');
        return false;
    }
    
    if (!book.isbn) {
        alert('ISBN을 입력해주세요.');
        return false;
    }
    
    // ISBN 형식 검사 (기본적인 영숫자 조합)
    const isbnPattern = /^[0-9X-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert('올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)');
        return false;
    }
    
    // 가격 유효성 검사
    if (book.price !== null && book.price < 0) {
        alert('가격은 0 이상이어야 합니다.');
        return false;
    }
    
    // 페이지 수 유효성 검사
    if (book.detail.pageCount !== null && book.detail.pageCount < 0) {
        alert('페이지 수는 0 이상이어야 합니다.');
        return false;
    }
    
    // URL 형식 검사 (입력된 경우에만)
    if (book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        alert('올바른 이미지 URL 형식이 아닙니다.');
        return false;
    }
    
    return true;
}

// URL 유효성 검사
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function createBook(bookData) {
    submitButton.disabled = true;
    submitButton.textContent = "등록 중...";

    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || "도서 등록에 실패했습니다.");
            });
        }
        return response.json();
    })
    .then(result => {
        showMessage("도서가 성공적으로 등록되었습니다!", "success");
        bookForm.reset();
        loadBooks();
    })
    .catch(error => {
        console.error(error);
        showMessage(error.message, "error");
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = "도서 등록";
    });
}

function deleteBook(bookId) {
    if (!confirm("이 도서를 정말로 삭제하시겠습니까?")) {
        return;
    }

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "DELETE"
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || "도서 삭제에 실패했습니다.");
            });
        }
        showMessage("도서가 성공적으로 삭제되었습니다!", "success");
        loadBooks();
    })
    .catch(error => {
        console.error(error);
        showMessage(error.message, "error");
    });
}

function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || "도서를 불러올 수 없습니다.");
            });
        }
        return response.json();
    })
    .then(book => {
        // 폼 채우기
        bookForm.title.value = book.title;
        bookForm.author.value = book.author;
        bookForm.isbn.value = book.isbn;
        bookForm.price.value = book.price || '';
        bookForm.publishDate.value = book.publishDate || '';
        
        if (book.detail) {
            bookForm.description.value = book.detail.description || '';
            bookForm.language.value = book.detail.language || '';
            bookForm.pageCount.value = book.detail.pageCount || '';
            bookForm.publisher.value = book.detail.publisher || '';
            bookForm.coverImageUrl.value = book.detail.coverImageUrl || '';
            bookForm.edition.value = book.detail.edition || '';
        }

        editingBookId = bookId;
        submitButton.textContent = "도서 수정";
        cancelButton.style.display = "inline-block";
    })
    .catch(error => {
        console.error(error);
        showMessage(error.message, "error");
    });
}


function updateBook(bookId, bookData) {
    submitButton.disabled = true;
    submitButton.textContent = "수정 중...";

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || "도서 수정에 실패했습니다.");
            });
        }
        return response.json();
    })
    .then(result => {
        showMessage("도서가 성공적으로 수정되었습니다!", "success");
        resetForm();
        loadBooks();
    })
    .catch(error => {
        console.error(error);
        showMessage(error.message, "error");
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = "도서 등록";
    });
}


function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = "none";
    hideMessage();
}

function showMessage(message, type) {
    formError.textContent = message;
    formError.style.display = 'block';
    formError.style.color = type === "success" ? "#28a745" : "#dc3545";

    setTimeout(() => {
        hideMessage();
    }, 3000);
}

function hideMessage() {
    formError.style.display = 'none';
}

// 도서 목록 로드 함수
function loadBooks() {    
    fetch(`${API_BASE_URL}/api/books`)
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`${errorData.message}`);
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log(error);
            alert(error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });    
}

// 도서 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        
        const formattedPrice = book.price ? `₩${book.price.toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? book.detail.publisher || '-' : '-';
        
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${formattedPrice}</td>
            <td>${formattedDate}</td>
            <td>${publisher}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;
        
        bookTableBody.appendChild(row);
    });
}
