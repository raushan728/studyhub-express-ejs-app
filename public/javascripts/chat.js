// Chat functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const newChatBtn = document.getElementById('newChatBtn');
    const newChatModal = document.getElementById('newChatModal');
    const closeNewChatModal = document.getElementById('closeNewChatModal');
    const chatSearch = document.getElementById('chatSearch');
    const chatList = document.getElementById('chatList');
    const startChatBtn = document.getElementById('startChatBtn');
    const startIndividualChat = document.getElementById('startIndividualChat');
    const startGroupChat = document.getElementById('startGroupChat');
    const chatTypeBtns = document.querySelectorAll('.chat-type-btn');
    const individualChatForm = document.getElementById('individualChatForm');
    const groupChatForm = document.getElementById('groupChatForm');
    const selectedUser = document.getElementById('selectedUser');
    const groupName = document.getElementById('groupName');
    const memberSelector = document.getElementById('memberSelector');
    const createIndividualChat = document.getElementById('createIndividualChat');
    const createGroupChat = document.getElementById('createGroupChat');

    // Modal functionality
    function openModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Event listeners for modals
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => openModal(newChatModal));
    }

    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => openModal(newChatModal));
    }

    if (startIndividualChat) {
        startIndividualChat.addEventListener('click', () => openModal(newChatModal));
    }

    if (startGroupChat) {
        startGroupChat.addEventListener('click', () => openModal(newChatModal));
    }

    if (closeNewChatModal) {
        closeNewChatModal.addEventListener('click', () => closeModal(newChatModal));
    }

    // Close modal when clicking outside
    if (newChatModal) {
        newChatModal.addEventListener('click', (e) => {
            if (e.target === newChatModal) {
                closeModal(newChatModal);
            }
        });
    }

    // Chat type selector
    chatTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            
            // Update active button
            chatTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide forms
            if (type === 'individual') {
                individualChatForm.classList.remove('hidden');
                groupChatForm.classList.add('hidden');
            } else {
                individualChatForm.classList.add('hidden');
                groupChatForm.classList.remove('hidden');
            }
        });
    });

    // Chat search functionality
    if (chatSearch) {
        chatSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const chatItems = document.querySelectorAll('.chat-item');
            
            chatItems.forEach(item => {
                const chatName = item.querySelector('.chat-name').textContent.toLowerCase();
                const chatPreview = item.querySelector('.chat-preview').textContent.toLowerCase();
                
                if (chatName.includes(searchTerm) || chatPreview.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Load users for individual chat
    async function loadUsers() {
        try {
            const response = await fetch('/chat/users');
            const data = await response.json();
            
            if (data.success) {
                populateUserSelect(data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    function populateUserSelect(users) {
        if (selectedUser) {
            selectedUser.innerHTML = '<option value="">Choose a user...</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = user.name;
                selectedUser.appendChild(option);
            });
        }
    }

    // Load users for group chat
    async function loadUsersForGroup() {
        try {
            const response = await fetch('/chat/users');
            const data = await response.json();
            
            if (data.success) {
                populateMemberSelector(data.users);
            }
        } catch (error) {
            console.error('Error loading users for group:', error);
        }
    }

    function populateMemberSelector(users) {
        if (memberSelector) {
            memberSelector.innerHTML = '';
            users.forEach(user => {
                const memberItem = document.createElement('div');
                memberItem.className = 'member-item';
                memberItem.dataset.userId = user._id;
                
                memberItem.innerHTML = `
                    <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.name}">
                    <span>${user.name}</span>
                    <input type="checkbox" class="member-checkbox" value="${user._id}">
                `;
                
                memberSelector.appendChild(memberItem);
            });
        }
    }

    // Create individual chat
    if (createIndividualChat) {
        createIndividualChat.addEventListener('click', async () => {
            const participantId = selectedUser.value;
            
            if (!participantId) {
                showAlert('Please select a user to start a chat with.', 'error');
                return;
            }

            try {
                const response = await fetch('/chat/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ participantId })
                });

                const data = await response.json();
                
                if (data.success) {
                    showAlert(data.message, 'success');
                    closeModal(newChatModal);
                    // Redirect to the new chat
                    window.location.href = `/chat/${data.chatId}`;
                } else {
                    showAlert(data.error, 'error');
                }
            } catch (error) {
                console.error('Error creating chat:', error);
                showAlert('Failed to create chat. Please try again.', 'error');
            }
        });
    }

    // Create group chat
    if (createGroupChat) {
        createGroupChat.addEventListener('click', async () => {
            const chatName = groupName.value.trim();
            const selectedMembers = Array.from(document.querySelectorAll('.member-checkbox:checked'))
                .map(checkbox => checkbox.value);
            
            if (!chatName) {
                showAlert('Please enter a group name.', 'error');
                return;
            }
            
            if (selectedMembers.length === 0) {
                showAlert('Please select at least one member for the group.', 'error');
                return;
            }

            try {
                const response = await fetch('/chat/create-group', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        chatName, 
                        participantIds: selectedMembers 
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showAlert(data.message, 'success');
                    closeModal(newChatModal);
                    // Redirect to the new group chat
                    window.location.href = `/chat/${data.chatId}`;
                } else {
                    showAlert(data.error, 'error');
                }
            } catch (error) {
                console.error('Error creating group chat:', error);
                showAlert('Failed to create group chat. Please try again.', 'error');
            }
        });
    }

    // Chat item click handler
    if (chatList) {
        chatList.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            if (chatItem) {
                const chatId = chatItem.dataset.chatId;
                if (chatId) {
                    window.location.href = `/chat/${chatId}`;
                }
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

    // Initialize
    if (newChatModal) {
        // Load users when modal is opened
        newChatBtn?.addEventListener('click', () => {
            loadUsers();
            loadUsersForGroup();
        });
        
        startChatBtn?.addEventListener('click', () => {
            loadUsers();
            loadUsersForGroup();
        });
        
        startIndividualChat?.addEventListener('click', () => {
            loadUsers();
            loadUsersForGroup();
        });
        
        startGroupChat?.addEventListener('click', () => {
            loadUsers();
            loadUsersForGroup();
        });
    }

    // Auto-resize textarea
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    });

    // Real-time chat updates (if on chat page)
    if (window.location.pathname.startsWith('/chat/')) {
        // Set up periodic updates for chat list
        setInterval(updateChatList, 30000); // Update every 30 seconds
    }

    async function updateChatList() {
        try {
            const response = await fetch('/chat');
            const html = await response.text();
            
            // Parse the HTML and extract chat list
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newChatList = doc.querySelector('.chat-list');
            
            if (newChatList && chatList) {
                chatList.innerHTML = newChatList.innerHTML;
            }
        } catch (error) {
            console.error('Error updating chat list:', error);
        }
    }
}); 