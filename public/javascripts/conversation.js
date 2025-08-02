// Conversation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const messagesWrapper = document.getElementById('messagesWrapper');
    const attachFileBtn = document.getElementById('attachFileBtn');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const fileUploadModal = document.getElementById('fileUploadModal');
    const closeFileModal = document.getElementById('closeFileModal');
    const uploadFile = document.getElementById('uploadFile');
    const uploadImage = document.getElementById('uploadImage');
    const fileInput = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput');
    const uploadPreview = document.getElementById('uploadPreview');
    const fileName = document.getElementById('fileName');
    const removeFile = document.getElementById('removeFile');
    const sendFileBtn = document.getElementById('sendFileBtn');
    const chatInfoBtn = document.getElementById('chatInfoBtn');
    const chatInfoModal = document.getElementById('chatInfoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const deleteChatBtn = document.getElementById('deleteChatBtn');

    // Chat data
    const currentChatId = document.getElementById('currentChatId')?.value;
    const currentUserId = document.getElementById('currentUserId')?.value;
    const currentUserName = document.getElementById('currentUserName')?.value;

    let selectedFile = null;
    let selectedFileType = null;

    // Scroll to bottom of messages
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Initialize scroll to bottom
    scrollToBottom();

    // Send message function
    async function sendMessage(content, messageType = 'text', fileUrl = null, fileName = null) {
        if (!content.trim() && !fileUrl) return;

        try {
            const response = await fetch(`/chat/${currentChatId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content.trim(),
                    messageType,
                    fileUrl,
                    fileName
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Add message to UI
                addMessageToUI(data.message);
                
                // Clear input
                if (messageInput) {
                    messageInput.value = '';
                    messageInput.style.height = 'auto';
                }
                
                // Clear file selection
                clearFileSelection();
                
                // Scroll to bottom
                scrollToBottom();
            } else {
                showAlert(data.error, 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showAlert('Failed to send message. Please try again.', 'error');
        }
    }

    // Add message to UI
    function addMessageToUI(message) {
        if (!messagesWrapper) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender._id === currentUserId ? 'sent' : 'received'}`;
        messageDiv.dataset.messageId = message._id;

        const isOwnMessage = message.sender._id === currentUserId;
        const timeString = new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        let messageContent = '';
        
        if (message.messageType === 'text') {
            messageContent = `<div class="message-text">${message.content}</div>`;
        } else if (message.messageType === 'file') {
            messageContent = `
                <div class="message-text">
                    <div class="file-message">
                        <i class="fas fa-file"></i>
                        <span>${message.fileName}</span>
                        <a href="${message.fileUrl}" target="_blank" class="btn btn-sm btn-primary">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            `;
        } else if (message.messageType === 'image') {
            messageContent = `
                <div class="message-text">
                    <div class="image-message">
                        <img src="${message.fileUrl}" alt="Image">
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="${message.sender.avatar || '/images/default-avatar.png'}" alt="${message.sender.name}">
            </div>
            
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender.name}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                
                ${messageContent}
                
                <div class="message-status">
                    ${isOwnMessage ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        messagesWrapper.appendChild(messageDiv);
    }

    // Send text message
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', () => {
            const content = messageInput.value.trim();
            if (content) {
                sendMessage(content, 'text');
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const content = messageInput.value.trim();
                if (content) {
                    sendMessage(content, 'text');
                }
            }
        });
    }

    // File upload functionality
    if (attachFileBtn) {
        attachFileBtn.addEventListener('click', () => {
            openModal(fileUploadModal);
        });
    }

    if (attachImageBtn) {
        attachImageBtn.addEventListener('click', () => {
            openModal(fileUploadModal);
        });
    }

    if (closeFileModal) {
        closeFileModal.addEventListener('click', () => {
            closeModal(fileUploadModal);
            clearFileSelection();
        });
    }

    // Upload file option
    if (uploadFile) {
        uploadFile.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Upload image option
    if (uploadImage) {
        uploadImage.addEventListener('click', () => {
            imageInput.click();
        });
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelection(file, 'file');
            }
        });
    }

    // Image input change
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelection(file, 'image');
            }
        });
    }

    // Handle file selection
    function handleFileSelection(file, type) {
        selectedFile = file;
        selectedFileType = type;
        
        if (uploadPreview && fileName) {
            fileName.textContent = file.name;
            uploadPreview.style.display = 'block';
            sendFileBtn.style.display = 'block';
        }
    }

    // Remove file
    if (removeFile) {
        removeFile.addEventListener('click', () => {
            clearFileSelection();
        });
    }

    // Clear file selection
    function clearFileSelection() {
        selectedFile = null;
        selectedFileType = null;
        
        if (fileInput) fileInput.value = '';
        if (imageInput) imageInput.value = '';
        if (uploadPreview) uploadPreview.style.display = 'none';
        if (sendFileBtn) sendFileBtn.style.display = 'none';
    }

    // Send file
    if (sendFileBtn) {
        sendFileBtn.addEventListener('click', async () => {
            if (!selectedFile) return;

            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('messageType', selectedFileType);

                const response = await fetch(`/chat/${currentChatId}/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    sendMessage('', selectedFileType, data.fileUrl, selectedFile.name);
                    closeModal(fileUploadModal);
                } else {
                    showAlert(data.error, 'error');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                showAlert('Failed to upload file. Please try again.', 'error');
            }
        });
    }

    // Chat info modal
    if (chatInfoBtn) {
        chatInfoBtn.addEventListener('click', () => {
            openModal(chatInfoModal);
        });
    }

    if (closeInfoModal) {
        closeInfoModal.addEventListener('click', () => {
            closeModal(chatInfoModal);
        });
    }

    // Delete chat
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
                try {
                    const response = await fetch(`/chat/${currentChatId}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        showAlert('Chat deleted successfully', 'success');
                        setTimeout(() => {
                            window.location.href = '/chat';
                        }, 1000);
                    } else {
                        showAlert(data.error, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting chat:', error);
                    showAlert('Failed to delete chat. Please try again.', 'error');
                }
            }
        });
    }

    // Modal functions
    function openModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Close modals when clicking outside
    if (fileUploadModal) {
        fileUploadModal.addEventListener('click', (e) => {
            if (e.target === fileUploadModal) {
                closeModal(fileUploadModal);
                clearFileSelection();
            }
        });
    }

    if (chatInfoModal) {
        chatInfoModal.addEventListener('click', (e) => {
            if (e.target === chatInfoModal) {
                closeModal(chatInfoModal);
            }
        });
    }

    // Alert function
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Real-time message updates
    let lastMessageId = null;
    
    // Get the last message ID from existing messages
    const existingMessages = document.querySelectorAll('.message');
    if (existingMessages.length > 0) {
        const lastMessage = existingMessages[existingMessages.length - 1];
        lastMessageId = lastMessage.dataset.messageId;
    }

    // Poll for new messages
    function pollForNewMessages() {
        if (!currentChatId) return;

        fetch(`/chat/${currentChatId}/messages?lastId=${lastMessageId || ''}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.messages) {
                    data.messages.forEach(message => {
                        if (message._id !== lastMessageId) {
                            addMessageToUI(message);
                            lastMessageId = message._id;
                        }
                    });
                    
                    if (data.messages.length > 0) {
                        scrollToBottom();
                    }
                }
            })
            .catch(error => {
                console.error('Error polling for messages:', error);
            });
    }

    // Start polling for new messages
    setInterval(pollForNewMessages, 3000); // Poll every 3 seconds

    // Mark messages as read when user is active
    let isUserActive = true;
    
    document.addEventListener('visibilitychange', () => {
        isUserActive = !document.hidden;
    });

    function markMessagesAsRead() {
        if (!isUserActive || !currentChatId) return;

        fetch(`/chat/${currentChatId}/read`, {
            method: 'POST'
        }).catch(error => {
            console.error('Error marking messages as read:', error);
        });
    }

    // Mark messages as read periodically
    setInterval(markMessagesAsRead, 5000); // Every 5 seconds

    // Auto-resize textarea
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }

    // Typing indicator
    let typingTimeout;
    
    if (messageInput) {
        messageInput.addEventListener('input', () => {
            // Clear existing timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Set new timeout
            typingTimeout = setTimeout(() => {
                // Stop typing indicator
                console.log('User stopped typing');
            }, 1000);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (messageInput && document.activeElement === messageInput) {
                e.preventDefault();
                const content = messageInput.value.trim();
                if (content) {
                    sendMessage(content, 'text');
                }
            }
        }
    });

    // Initialize
    console.log('Conversation initialized for chat:', currentChatId);
}); 