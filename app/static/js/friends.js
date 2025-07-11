// Friends & Social Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Friends & Social page script loaded');
    
    let currentChatUser = null;
    let currentCall = null;
    let chatSocket = null;
    
    // Initialize friends page
    function initializeFriendsPage() {
        setupNavigationTabs();
        setupFriendSearch();
        setupChatWindow();
        setupCallWindow();
        loadFriends();
        loadFriendRequests();
        initializeChat();
    }

    // Navigation Tabs Setup
    function setupNavigationTabs() {
        const navBtns = document.querySelectorAll('.friends-nav-btn');
        const tabContents = document.querySelectorAll('.friends-tab-content');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                // Remove active from all buttons and contents
                navBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active to clicked button and target content
                this.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Load content based on tab
                switch(targetTab) {
                    case 'friends':
                        loadFriends();
                        break;
                    case 'groups':
                        loadSocialGroups();
                        break;
                    case 'requests':
                        loadFriendRequests();
                        break;
                    case 'search':
                        focusSearchInput();
                        break;
                }
            });
        });
    }

    // Friend Search Setup
    function setupFriendSearch() {
        const searchInput = document.getElementById('friendSearchInput');
        const searchBtn = document.getElementById('searchFriendsBtn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', performFriendSearch);
            
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performFriendSearch();
                }
            });
            
            // Real-time search suggestions
            searchInput.addEventListener('input', function() {
                const query = this.value.trim();
                if (query.length > 2) {
                    showSearchSuggestions(query);
                }
            });
        }
    }

    // Load Friends
    function loadFriends() {
        const friendsList = document.getElementById('friendsList');
        const totalFriends = document.getElementById('totalFriends');
        const onlineFriends = document.getElementById('onlineFriends');
        
        if (!friendsList) return;

        // Show loading
        friendsList.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading friends...</span>
            </div>
        `;

        // Simulate API call
        setTimeout(() => {
            const friends = [
                {
                    id: 'user001',
                    username: 'alex_smith',
                    displayName: 'Alex Smith',
                    avatar: '../static/img/user-solid.svg',
                    status: 'online',
                    lastSeen: 'Online',
                    mutualFriends: 5,
                    isOnline: true
                },
                {
                    id: 'user002',
                    username: 'sarah_jones',
                    displayName: 'Sarah Jones',
                    avatar: '../static/img/user-solid.svg',
                    status: 'offline',
                    lastSeen: '2 hours ago',
                    mutualFriends: 3,
                    isOnline: false
                },
                {
                    id: 'user003',
                    username: 'mike_wilson',
                    displayName: 'Mike Wilson',
                    avatar: '../static/img/user-solid.svg',
                    status: 'online',
                    lastSeen: 'Online',
                    mutualFriends: 8,
                    isOnline: true
                }
            ];

            renderFriends(friends, friendsList);
            
            // Update stats
            if (totalFriends) totalFriends.textContent = friends.length;
            if (onlineFriends) onlineFriends.textContent = friends.filter(f => f.isOnline).length;
        }, 1000);
    }

    // Render Friends
    function renderFriends(friends, container) {
        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mini">
                    <i class="fas fa-user-friends"></i>
                    <p>No friends yet</p>
                    <button class="friends-action-btn" onclick="switchToSearchTab()">Find Friends</button>
                </div>
            `;
            return;
        }

        const friendsHTML = friends.map(friend => `
            <div class="friend-card" data-user-id="${friend.id}">
                <div class="friend-avatar-container">
                    <img src="${friend.avatar}" alt="${friend.displayName}" class="friend-avatar">
                    <div class="friend-status-indicator ${friend.status}"></div>
                </div>
                <div class="friend-info">
                    <h4 class="friend-name">${friend.displayName}</h4>
                    <p class="friend-username">@${friend.username}</p>
                    <p class="friend-status">${friend.lastSeen}</p>
                    <p class="friend-mutual">${friend.mutualFriends} mutual friends</p>
                </div>
                <div class="friend-actions">
                    <button class="friend-action-btn chat-btn" onclick="openChat('${friend.id}', '${friend.displayName}', '${friend.avatar}', '${friend.status}')" title="Chat">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="friend-action-btn call-btn" onclick="initiateVoiceCall('${friend.id}', '${friend.displayName}', '${friend.avatar}')" title="Voice Call">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="friend-action-btn video-btn" onclick="initiateVideoCall('${friend.id}', '${friend.displayName}', '${friend.avatar}')" title="Video Call">
                        <i class="fas fa-video"></i>
                    </button>
                    <button class="friend-action-btn more-btn" onclick="showFriendOptions('${friend.id}')" title="More">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = friendsHTML;
    }

    // Perform Friend Search
    function performFriendSearch() {
        const searchInput = document.getElementById('friendSearchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) return;
        
        const query = searchInput.value.trim();
        if (!query) {
            showNotification('Please enter a username or email to search', 'error');
            return;
        }

        // Show loading
        searchResults.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Searching for users...</span>
            </div>
        `;

        // Simulate Firebase search
        setTimeout(() => {
            const results = [
                {
                    id: 'user004',
                    username: 'john_doe',
                    displayName: 'John Doe',
                    avatar: '../static/img/user-solid.svg',
                    mutualFriends: 2,
                    isFriend: false
                },
                {
                    id: 'user005',
                    username: 'emma_watson',
                    displayName: 'Emma Watson',
                    avatar: '../static/img/user-solid.svg',
                    mutualFriends: 0,
                    isFriend: false
                }
            ];

            renderSearchResults(results, searchResults);
        }, 1500);
    }

    // Render Search Results
    function renderSearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-user-slash"></i>
                    <p>No users found</p>
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(user => `
            <div class="search-result-card">
                <img src="${user.avatar}" alt="${user.displayName}" class="result-avatar">
                <div class="result-info">
                    <h4 class="result-name">${user.displayName}</h4>
                    <p class="result-username">@${user.username}</p>
                    <p class="result-mutual">${user.mutualFriends} mutual friends</p>
                </div>
                <div class="result-actions">
                    ${user.isFriend ? 
                        '<button class="friends-action-btn" disabled>Friends</button>' :
                        `<button class="friends-action-btn" onclick="sendFriendRequest('${user.id}', '${user.displayName}')">Add Friend</button>`
                    }
                </div>
            </div>
        `).join('');

        container.innerHTML = resultsHTML;
    }

    // Chat Window Setup
    function setupChatWindow() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendMessageBtn');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const attachmentBtn = document.getElementById('attachmentBtn');
        const emojiBtn = document.getElementById('emojiBtn');

        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
            
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Show typing indicator
            chatInput.addEventListener('input', function() {
                if (currentChatUser) {
                    showTypingIndicator();
                }
            });
        }

        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', closeChat);
        }

        if (attachmentBtn) {
            attachmentBtn.addEventListener('click', showAttachmentOptions);
        }

        if (emojiBtn) {
            emojiBtn.addEventListener('click', showEmojiPicker);
        }
    }

    // Call Window Setup
    function setupCallWindow() {
        const endCallBtn = document.getElementById('endCallBtn');
        const muteBtn = document.getElementById('muteBtn');
        const toggleVideoBtn = document.getElementById('toggleVideoBtn');

        if (endCallBtn) {
            endCallBtn.addEventListener('click', endCall);
        }

        if (muteBtn) {
            muteBtn.addEventListener('click', toggleMute);
        }

        if (toggleVideoBtn) {
            toggleVideoBtn.addEventListener('click', toggleVideo);
        }
    }

    // Chat Functions
    window.openChat = function(userId, displayName, avatar, status) {
        currentChatUser = { userId, displayName, avatar, status };
        
        const chatWindow = document.getElementById('chatWindow');
        const chatUsername = document.getElementById('chatUsername');
        const chatStatus = document.getElementById('chatStatus');
        const chatAvatar = document.getElementById('chatAvatar');
        const chatMessages = document.getElementById('chatMessages');

        if (chatWindow) {
            chatWindow.classList.add('open');
            
            if (chatUsername) chatUsername.textContent = displayName;
            if (chatStatus) chatStatus.textContent = status === 'online' ? 'Online' : 'Offline';
            if (chatAvatar) chatAvatar.src = avatar;
            
            // Load chat history
            loadChatHistory(userId, chatMessages);
        }
    };

    window.closeChat = function() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            chatWindow.classList.remove('open');
        }
        currentChatUser = null;
    };

    function sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatInput || !chatMessages || !currentChatUser) return;
        
        const message = chatInput.value.trim();
        if (!message) return;

        // Add message to chat
        const messageElement = createMessageElement(message, 'sent', new Date());
        chatMessages.appendChild(messageElement);
        
        // Clear input
        chatInput.value = '';
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate response
        setTimeout(() => {
            const responseMessage = generateAutoResponse(message);
            const responseElement = createMessageElement(responseMessage, 'received', new Date());
            chatMessages.appendChild(responseElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    function createMessageElement(text, type, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
                <span class="message-time">${formatTime(timestamp)}</span>
            </div>
        `;
        
        return messageDiv;
    }

    function loadChatHistory(userId, container) {
        // Simulate loading chat history
        container.innerHTML = `
            <div class="chat-message received">
                <div class="message-content">
                    <p>Hey! How are you?</p>
                    <span class="message-time">10:30 AM</span>
                </div>
            </div>
            <div class="chat-message sent">
                <div class="message-content">
                    <p>Hi! I'm doing great, thanks! How about you?</p>
                    <span class="message-time">10:32 AM</span>
                </div>
            </div>
        `;
        
        container.scrollTop = container.scrollHeight;
    }

    // Call Functions
    window.initiateVoiceCall = function(userId, displayName, avatar) {
        currentCall = { userId, displayName, avatar, type: 'voice' };
        
        const callWindow = document.getElementById('callWindow');
        const callUsername = document.getElementById('callUsername');
        const callAvatar = document.getElementById('callAvatar');
        const callStatus = document.getElementById('callStatus');

        if (callWindow) {
            callWindow.classList.add('open');
            
            if (callUsername) callUsername.textContent = displayName;
            if (callAvatar) callAvatar.src = avatar;
            if (callStatus) callStatus.textContent = 'Calling...';
            
            // Simulate call connection
            setTimeout(() => {
                if (callStatus) callStatus.textContent = 'Connected';
            }, 3000);
        }
    };

    window.initiateVideoCall = function(userId, displayName, avatar) {
        currentCall = { userId, displayName, avatar, type: 'video' };
        
        const callWindow = document.getElementById('callWindow');
        const callUsername = document.getElementById('callUsername');
        const callAvatar = document.getElementById('callAvatar');
        const callStatus = document.getElementById('callStatus');

        if (callWindow) {
            callWindow.classList.add('open');
            
            if (callUsername) callUsername.textContent = displayName;
            if (callAvatar) callAvatar.src = avatar;
            if (callStatus) callStatus.textContent = 'Video calling...';
            
            // Simulate call connection
            setTimeout(() => {
                if (callStatus) callStatus.textContent = 'Video connected';
            }, 3000);
        }
    };

    function endCall() {
        const callWindow = document.getElementById('callWindow');
        if (callWindow) {
            callWindow.classList.remove('open');
        }
        currentCall = null;
    }

    function toggleMute() {
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.classList.toggle('muted');
            const icon = muteBtn.querySelector('i');
            if (icon) {
                icon.className = muteBtn.classList.contains('muted') ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            }
        }
    }

    function toggleVideo() {
        const videoBtn = document.getElementById('toggleVideoBtn');
        if (videoBtn) {
            videoBtn.classList.toggle('video-off');
            const icon = videoBtn.querySelector('i');
            if (icon) {
                icon.className = videoBtn.classList.contains('video-off') ? 'fas fa-video-slash' : 'fas fa-video';
            }
        }
    }

    // Additional Functions
    window.sendFriendRequest = function(userId, displayName) {
        showNotification(`Friend request sent to ${displayName}!`, 'success');
        
        // Update button to show request sent
        const resultCard = document.querySelector(`[onclick*="${userId}"]`).closest('.search-result-card');
        if (resultCard) {
            const actionBtn = resultCard.querySelector('.friends-action-btn');
            if (actionBtn) {
                actionBtn.textContent = 'Request Sent';
                actionBtn.disabled = true;
            }
        }
    };

    window.switchToSearchTab = function() {
        const searchTab = document.querySelector('[data-tab="search"]');
        if (searchTab) {
            searchTab.click();
        }
    };

    function showAttachmentOptions() {
        const attachmentMenu = document.createElement('div');
        attachmentMenu.className = 'attachment-menu';
        attachmentMenu.innerHTML = `
            <button onclick="selectFile('image')"><i class="fas fa-image"></i> Photo</button>
            <button onclick="selectFile('video')"><i class="fas fa-video"></i> Video</button>
            <button onclick="selectFile('document')"><i class="fas fa-file"></i> Document</button>
        `;
        
        // Position and show menu
        const attachmentBtn = document.getElementById('attachmentBtn');
        if (attachmentBtn) {
            attachmentBtn.appendChild(attachmentMenu);
        }
    }

    function showEmojiPicker() {
        showNotification('Emoji picker will be implemented', 'info');
    }

    function generateAutoResponse(message) {
        const responses = [
            "That's interesting!",
            "I see what you mean.",
            "Thanks for sharing!",
            "Really? Tell me more!",
            "Haha, that's funny!",
            "I agree with you.",
            "That makes sense."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator && currentChatUser) {
            typingIndicator.style.display = 'block';
            typingIndicator.querySelector('span').textContent = currentChatUser.displayName;
            
            // Hide after 3 seconds
            setTimeout(() => {
                typingIndicator.style.display = 'none';
            }, 3000);
        }
    }

    function loadFriendRequests() {
        const requestsList = document.getElementById('requestsList');
        const requestsBadge = document.getElementById('requestsBadge');
        
        if (!requestsList) return;

        // Simulate loading requests
        setTimeout(() => {
            const requests = []; // No requests initially
            
            if (requests.length === 0) {
                requestsList.innerHTML = `
                    <div class="empty-state-mini">
                        <i class="fas fa-inbox"></i>
                        <p>No pending requests</p>
                    </div>
                `;
            }
            
            if (requestsBadge) {
                requestsBadge.textContent = requests.length;
                requestsBadge.style.display = requests.length > 0 ? 'block' : 'none';
            }
        }, 500);
    }

    function loadSocialGroups() {
        const socialGroupsList = document.getElementById('socialGroupsList');
        
        if (!socialGroupsList) return;

        setTimeout(() => {
            const groups = []; // No groups initially
            
            if (groups.length === 0) {
                socialGroupsList.innerHTML = `
                    <div class="empty-state-mini">
                        <i class="fas fa-users"></i>
                        <p>No groups yet</p>
                        <button class="create-group-btn-mini">Create Your First Group</button>
                    </div>
                `;
            }
        }, 500);
    }

    function focusSearchInput() {
        const searchInput = document.getElementById('friendSearchInput');
        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
            }, 100);
        }
    }

    // Notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 0.9rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Initialize chat system
    function initializeChat() {
        // This would initialize WebSocket connection for real-time chat
        console.log('Chat system initialized');
    }

    // Initialize friends page
    initializeFriendsPage();
});