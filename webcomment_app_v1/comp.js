class CommentApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Добавляем стили в Shadow DOM
        this.shadowRoot.innerHTML = `
        <style>
        .comment {
            border: 2px solid #bcc;
            padding: 10px;
            margin: 10px 0;
        }

        .comment:nth-child(odd) {
            border: 2px solid #fff;
            background-color: #f0f0f0;
        }

        .comment:nth-child(even) {
            border: 2px solid #ccc;
            background-color: #e0e0e0;
        }

        .comment .reply {
            margin-left: 20px;
        }

        .comment .reply:nth-child(od) {
            border: 2px solid #ccc;
            background-color: #f5f5f5;
        }

        .comment .reply:nth-child(even) {
            border: 2px solid #fff;
            background-color: #e5e5e5;
        }
        </style>
    `;

        // Инициализация массива комментариев из localStorage
        this.comments = JSON.parse(localStorage.getItem('comments')) || [];

        // Форма для добавления новых комментариев
        const commentForm = document.createElement('form');
        commentForm.id = 'commentForm';

        const textarea = document.createElement('textarea');
        textarea.style.width = '50%';
        textarea.style.height = '50px';
        textarea.id = 'commentText';
        textarea.placeholder = 'Напишите комментарий';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Добавить комментарий';

        commentForm.appendChild(textarea);
        commentForm.appendChild(submitButton);

        // Обработчик события для отправки комментария
        commentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.addComment();
        });

        this.shadowRoot.appendChild(commentForm);

        // Добавление кнопки для очистки комментариев
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Очистить все комментарии!!!';
        clearButton.addEventListener('click', () => this.clearComments());
        this.shadowRoot.appendChild(clearButton);

        // Вызов метода рендеринга
        this.render();
    }

    // Метод для рендеринга комментариев
    render() {
        // Очистка содержимого Shadow DOM перед перерисовкой
        this.shadowRoot.querySelectorAll('.comment').forEach(comment => comment.remove());

        // Отображение существующих комментариев
        this.comments.forEach(comment => {
            this.renderComment(comment, this.shadowRoot);
        });
    }

    // Метод для рендеринга одного комментария
    renderComment(comment, parentElement) {
        const commentComponent = document.createElement('div');
        commentComponent.textContent = `${comment.text} (${comment.timestamp})`;
        commentComponent.classList.add('comment');

        // Добавление кнопки "Like"
        const likeButton = document.createElement('button');
        likeButton.textContent = `👍 ${comment.likes || 0} Like`;

        likeButton.addEventListener('click', () => {
            this.toggleLike(comment);
        });

        commentComponent.appendChild(likeButton);

        // Добавление кнопки "Reply"
        const replyButton = document.createElement('button');
        replyButton.textContent = '💬 Reply';
        replyButton.addEventListener('click', () => {
            this.showReplyForm(comment, commentComponent);
        });
        commentComponent.appendChild(replyButton);

        // Добавление кнопки "Delete"
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '❌ Delete';
        deleteButton.addEventListener('click', () => {
            this.deleteComment(comment);
        });
        commentComponent.appendChild(deleteButton);

        parentElement.appendChild(commentComponent);

        // Рекурсивный вызов renderComment для отображения вложенных ответов
        if (comment.replies) {
            comment.replies.forEach(reply => {
                this.renderComment(reply, commentComponent);
            });
        }
    }

    // Метод для переключения лайка
    toggleLike(comment) {
        comment.likes = comment.likes ? comment.likes + 1 : 1;
        localStorage.setItem('comments', JSON.stringify(this.comments));
        this.render();
    }

    // Метод для добавления комментария
    addComment() {
        const commentText = this.shadowRoot.getElementById('commentText').value.trim();
        if (commentText !== '') {
            const timestamp = new Date().toLocaleString();
            this.comments.push({ text: commentText, timestamp, replies: [] });
            localStorage.setItem('comments', JSON.stringify(this.comments));
            this.render();
            this.shadowRoot.getElementById('commentText').value = '';
        }
    }

    // Метод для отображения формы ответа на комментарий
    showReplyForm(parentComment, parentElement) {

        const replyForm = document.createElement('form');
        const replyTextarea = document.createElement('textarea');
        replyTextarea.style.width = '50%';
        replyTextarea.style.height = '50px';
        replyTextarea.placeholder = 'Напишите ответ';
        const replySubmitButton = document.createElement('button');
        replySubmitButton.type = 'submit';
        replySubmitButton.textContent = 'Отправить ответ';

        replyForm.appendChild(replyTextarea);
        replyForm.appendChild(replySubmitButton);

        replyForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const repliedCommentText = replyTextarea.value;
            this.addReply(repliedCommentText, parentComment, parentElement);
            replyTextarea.value = '';
            parentElement.removeChild(replyForm);
        });

        parentElement.appendChild(replyForm);
    }

    // Метод для добавления ответа на комментарий
    addReply(repliedCommentText, parentComment, parentElement) {
        const timestamp = new Date().toLocaleString();
        const reply = { text: repliedCommentText, timestamp, replies: [] };
        parentComment.replies.push(reply);
        localStorage.setItem('comments', JSON.stringify(this.comments));
        this.renderComment(reply, parentElement);
    }

    // Метод для удаления комментария
    deleteComment(comment) {
        const userConfirmed = confirm('Вы уверены, что хотите удалить этот комментарий?');
        if (userConfirmed) {
            this.traverseAndDelete(this.comments, comment);
            localStorage.setItem('comments', JSON.stringify(this.comments));
            this.render();
        }
    }

    // Метод для рекурсивного удаления комментария и его ответов
    traverseAndDelete(comments, targetComment) {
        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            if (comment === targetComment) {
                comments.splice(i, 1);
                return;
            }
            if (comment.replies) {
                this.traverseAndDelete(comment.replies, targetComment);
            }
        }
    }

    // Метод для очистки всех комментариев
    clearComments() {
        const userConfirmed = confirm('Вы уверены, что хотите очистить все комментарии?');
        if (userConfirmed) {
            this.comments = [];
            localStorage.removeItem('comments');
            this.render();
        }
    }
}

customElements.define('comment-app', CommentApp);
