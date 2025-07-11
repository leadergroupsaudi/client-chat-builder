(function() {
    const scriptTag = document.currentScript;
    const agentId = scriptTag.getAttribute('data-agent-id');
    const companyId = scriptTag.getAttribute('data-company-id') || '1'; // Default to 1 if not provided

    if (!agentId) {
        console.error('AgentConnect: data-agent-id attribute is missing from the script tag.');
        return;
    }

    console.log(`AgentConnect: Initializing widget for Agent ID: ${agentId}, Company ID: ${companyId}`);

    // --- Basic Chat Widget UI (Example) ---
    const chatButton = document.createElement('button');
    chatButton.innerText = 'Chat with Agent';
    chatButton.style.position = 'fixed';
    chatButton.style.bottom = '20px';
    chatButton.style.right = '20px';
    chatButton.style.padding = '10px 20px';
    chatButton.style.backgroundColor = '#4F46E5'; // Deeper indigo
    chatButton.style.color = 'white';
    chatButton.style.border = 'none';
    chatButton.style.borderRadius = '25px'; // More rounded
    chatButton.style.cursor = 'pointer';
    chatButton.style.zIndex = '10000';
    chatButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; // Softer, larger shadow
    chatButton.style.transition = 'all 0.3s ease';
    chatButton.onmouseover = () => { chatButton.style.backgroundColor = '#4338CA'; chatButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)'; };
    chatButton.onmouseout = () => { chatButton.style.backgroundColor = '#4F46E5'; chatButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; };
    document.body.appendChild(chatButton);

    const chatWindow = document.createElement('div');
    chatWindow.style.position = 'fixed';
    chatWindow.style.bottom = '80px';
    chatWindow.style.right = '20px';
    chatWindow.style.width = '370px'; // Slightly wider for better message display
    chatWindow.style.height = '550px'; // Taller for more conversation history
    chatWindow.style.backgroundColor = '#F9FAFB'; // Light gray background for the whole window
    chatWindow.style.borderRadius = '12px'; // More rounded corners
    chatWindow.style.border = '1px solid #E0E0E0'; // Lighter, subtle border
    chatWindow.style.overflow = 'hidden';
    chatWindow.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)'; // More pronounced, softer shadow
    chatWindow.style.zIndex = '9999';
    chatWindow.style.display = 'none'; // Hidden by default
    chatWindow.style.display = 'flex'; // Make it flex container
    chatWindow.style.flexDirection = 'column'; // Arrange children vertically
    document.body.appendChild(chatWindow);

    // Chat Header
    const chatHeader = document.createElement('div');
    chatHeader.style.padding = '15px 20px'; // Slightly more padding
    chatHeader.style.borderBottom = '1px solid #E0E0E0'; // Lighter border
    chatHeader.style.background = 'linear-gradient(to right, #FFFFFF, #F5F5F5)'; // Subtle gradient
    chatHeader.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.05)'; // Softer shadow
    chatHeader.style.flexShrink = '0';
    chatHeader.style.position = 'sticky';
    chatHeader.style.top = '0';
    chatHeader.style.zIndex = '10';
    chatHeader.style.display = 'flex';
    chatHeader.style.alignItems = 'center';
    chatHeader.style.gap = '15px'; // Increased gap

    const agentAvatar = document.createElement('div');
    agentAvatar.style.height = '45px'; // Slightly larger avatar
    agentAvatar.style.width = '45px';
    agentAvatar.style.borderRadius = '50%'; // Perfectly round
    agentAvatar.style.background = 'linear-gradient(to right, #6366F1, #9333EA)'; // Vibrant gradient
    agentAvatar.style.color = 'white';
    agentAvatar.style.fontWeight = '600';
    agentAvatar.style.fontSize = '1.1rem'; // Larger font for initials
    agentAvatar.style.display = 'flex';
    agentAvatar.style.alignItems = 'center';
    agentAvatar.style.justifyContent = 'center';
    agentAvatar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Clearer shadow
    agentAvatar.innerText = 'AG'; // Placeholder for agent initials
    chatHeader.appendChild(agentAvatar);

    const agentInfo = document.createElement('div');
    const agentName = document.createElement('h3');
    agentName.style.fontWeight = '600'; // Bolder font
    agentName.style.fontSize = '1.1rem'; // Slightly larger name
    agentName.style.color = '#333333'; // Darker text
    agentName.innerText = 'Default Agent'; // Placeholder for agent name
    const agentWelcomeMessage = document.createElement('p');
    agentWelcomeMessage.style.fontSize = '0.85rem'; // Slightly smaller welcome message
    agentWelcomeMessage.style.color = '#666666'; // Softer text color
    agentWelcomeMessage.innerText = 'Hello! How can I help you?'; // Placeholder for welcome message
    agentInfo.appendChild(agentName);
    agentInfo.appendChild(agentWelcomeMessage);
    chatHeader.appendChild(agentInfo);
    chatWindow.appendChild(chatHeader);

    // Messages Container
    const messagesContainer = document.createElement('div');
    messagesContainer.style.flex = '1';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '20px'; // More padding
    messagesContainer.style.display = 'flex';
    messagesContainer.style.flexDirection = 'column';
    messagesContainer.style.gap = '12px'; // Consistent spacing between messages
    messagesContainer.style.background = '#F0F2F5'; // Light gray background for chat area
    messagesContainer.style.minHeight = '0';
    // Custom scrollbar for a cleaner look
    messagesContainer.style.setProperty('-ms-overflow-style', 'none'); // IE and Edge
    messagesContainer.style.setProperty('scrollbar-width', 'none'); // Firefox
    messagesContainer.style.setProperty('::-webkit-scrollbar', 'display: none'); // Chrome, Safari, Opera
    chatWindow.appendChild(messagesContainer);

    // Message Input Area
    const messageInputArea = document.createElement('div');
    messageInputArea.style.padding = '16px'; // p-4
    messageInputArea.style.borderTop = '1px solid #e5e7eb'; // border-t
    messageInputArea.style.backgroundColor = 'white';
    messageInputArea.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'; // shadow-inner
    messageInputArea.style.flexShrink = '0'; // flex-shrink-0
    messageInputArea.style.display = 'flex';
    messageInputArea.style.alignItems = 'flex-end';
    messageInputArea.style.gap = '8px'; // gap-2

    const messageInput = document.createElement('textarea'); // Changed to textarea
    messageInput.placeholder = 'Type your message...';
    messageInput.style.flex = '1'; // flex-1
    messageInput.style.minHeight = '40px'; // Smaller min-height for a more compact look
    messageInput.style.maxHeight = '100px'; // Prevent it from growing too large
    messageInput.style.resize = 'vertical'; // Allow vertical resize
    messageInput.style.border = '1px solid #E0E0E0'; // Lighter border
    messageInput.style.borderRadius = '20px'; // More rounded
    messageInput.style.padding = '10px 15px';
    messageInput.style.outline = 'none';
    messageInput.style.transition = 'border-color 0.2s, box-shadow 0.2s';
    messageInput.style.fontFamily = 'inherit'; // Inherit font from body
    messageInput.onfocus = () => { messageInput.style.borderColor = '#6366F1'; messageInput.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)'; }; // Focus style
    messageInput.onblur = () => { messageInput.style.borderColor = '#E0E0E0'; messageInput.style.boxShadow = 'none'; };

    const sendButton = document.createElement('button');
    sendButton.innerText = 'Send';
    
    sendButton.onclick = () => {
        if (messageInput.value.trim() && ws && ws.readyState === WebSocket.OPEN) {
            const userMessage = messageInput.value;

            const messageDiv = document.createElement('div');
            messageDiv.style.display = 'flex';
            messageDiv.style.justifyContent = 'flex-end'; // User messages on the right
            messageDiv.style.animation = 'fade-in 0.3s ease-out';

            const messageBubble = document.createElement('div');
            messageBubble.style.maxWidth = '80%'; // Slightly wider max-width
            messageBubble.style.padding = '10px 15px'; // Refined padding
            messageBubble.style.borderRadius = '18px'; // More rounded corners
            messageBubble.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Softer shadow
            messageBubble.style.background = '#4F46E5'; // Professional colors
            messageBubble.style.color = 'white';

            const messageText = document.createElement('p');
            messageText.style.fontSize = '0.9rem'; // Slightly larger font
            messageText.innerText = userMessage;
            messageBubble.appendChild(messageText);

            const messageTime = document.createElement('p');
            messageTime.style.fontSize = '0.7rem'; // Smaller timestamp
            messageTime.style.marginTop = '5px'; // More space
            messageTime.style.color = 'rgba(255, 255, 255, 0.7)'; // Subtle timestamp color
            messageTime.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formatted time
            messageBubble.appendChild(messageTime);

            messageDiv.appendChild(messageBubble);
            messagesContainer.appendChild(messageDiv);

            ws.send(userMessage);
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    messageInputArea.appendChild(messageInput);
    messageInputArea.appendChild(sendButton);
    chatWindow.appendChild(messageInputArea);

    chatButton.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    };

    // --- WebSocket Connection ---
    let ws;
    const sessionId = 'embed_session_' + Math.random().toString(36).substring(2, 15); // Unique session ID for embedded widget

    function connectWebSocket() {
        ws = new WebSocket(`ws://localhost:8000/api/v1/conversations/ws/${companyId}/${agentId}/${sessionId}`);

        ws.onopen = () => {
            console.log('AgentConnect: WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const message = data.message;
            const sender = data.sender;

            const messageDiv = document.createElement('div');
            messageDiv.style.display = 'flex';
            messageDiv.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';
            messageDiv.style.animation = 'fade-in 0.3s ease-out';

            const messageBubble = document.createElement('div');
            messageBubble.style.maxWidth = '80%'; // Slightly wider max-width
            messageBubble.style.padding = '10px 15px'; // Refined padding
            messageBubble.style.borderRadius = '18px'; // More rounded corners
            messageBubble.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Softer shadow
            messageBubble.style.backgroundColor = sender === 'user' ? '#4F46E5' : '#FFFFFF'; // Professional colors
            messageBubble.style.color = sender === 'user' ? 'white' : '#333333';
            messageBubble.style.border = sender === 'user' ? 'none' : '1px solid #E0E0E0'; // Subtle border for agent

            const messageText = document.createElement('p');
            messageText.style.fontSize = '0.9rem'; // Slightly larger font
            messageText.innerText = message;
            messageBubble.appendChild(messageText);

            const messageTime = document.createElement('p');
            messageTime.style.fontSize = '0.7rem'; // Smaller timestamp
            messageTime.style.marginTop = '5px'; // More space
            messageTime.style.color = sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : '#999999'; // Subtle timestamp color
            messageTime.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formatted time
            messageBubble.appendChild(messageTime);

            messageDiv.appendChild(messageBubble);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        ws.onclose = () => {
            console.log('AgentConnect: WebSocket disconnected. Reconnecting in 5 seconds...');
            messagesContainer.innerHTML += '<p><em>Disconnected. Reconnecting...</em></p>';
            setTimeout(connectWebSocket, 5000); // Attempt to reconnect
        };

        ws.onerror = (error) => {
            console.error('AgentConnect: WebSocket error:', error);
            ws.close(); // Close to trigger reconnect
        };
    }

    messageInput.onkeypress = (e) => {
        if (e.key === 'Enter' && messageInput.value.trim() && ws && ws.readyState === WebSocket.OPEN) {
            const userMessage = messageInput.value;

            const messageDiv = document.createElement('div');
            messageDiv.style.display = 'flex';
            messageDiv.style.justifyContent = 'flex-end'; // User messages on the right
            messageDiv.style.animation = 'fade-in 0.3s ease-out';

            const messageBubble = document.createElement('div');
            messageBubble.style.maxWidth = '80%'; // Slightly wider max-width
            messageBubble.style.padding = '10px 15px'; // Refined padding
            messageBubble.style.borderRadius = '18px'; // More rounded corners
            messageBubble.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; // Softer shadow
            messageBubble.style.background = '#4F46E5'; // Professional colors
            messageBubble.style.color = 'white';

            const messageText = document.createElement('p');
            messageText.style.fontSize = '0.9rem'; // Slightly larger font
            messageText.innerText = userMessage;
            messageBubble.appendChild(messageText);

            const messageTime = document.createElement('p');
            messageTime.style.fontSize = '0.7rem'; // Smaller timestamp
            messageTime.style.marginTop = '5px'; // More space
            messageTime.style.color = 'rgba(255, 255, 255, 0.7)'; // Subtle timestamp color
            messageTime.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formatted time
            messageBubble.appendChild(messageTime);

            messageDiv.appendChild(messageBubble);
            messagesContainer.appendChild(messageDiv);

            ws.send(userMessage);
            messageInput.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    connectWebSocket();

})();