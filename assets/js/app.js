/**
 * Prasun AI — Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        app: document.querySelector('.app'),
        sidebar: document.getElementById('sidebar'),
        openSidebar: document.getElementById('openSidebar'),
        closeSidebar: document.getElementById('closeSidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        
        newChatButton: document.getElementById('newChatButton'),
        chatSearch: document.getElementById('chatSearch'),
        historyContainer: document.getElementById('historyContainer'),
        
        modelSelector: document.getElementById('modelSelector'),
        modelDropdown: document.getElementById('modelDropdown'),
        modelName: document.querySelector('.model-name'),
        clearChatButton: document.getElementById('clearChatButton'),
        shareButton: document.getElementById('shareButton'),
        
        themeButton: document.getElementById('themeButton'),
        themeColorMeta: document.getElementById('themeColor'),
        settingsButton: document.getElementById('settingsButton'),
        
        chatArea: document.getElementById('chatArea'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        messages: document.getElementById('messages'),
        suggestionCards: document.querySelectorAll('.suggestion-card'),
        
        messageInput: document.getElementById('messageInput'),
        attachButton: document.getElementById('attachButton'),
        fileInput: document.getElementById('fileInput'),
        attachmentPreview: document.getElementById('attachmentPreview'),
        attachmentName: document.getElementById('attachmentName'),
        attachmentSize: document.getElementById('attachmentSize'),
        removeAttachment: document.getElementById('removeAttachment'),
        voiceButton: document.getElementById('voiceButton'),
        toolsButton: document.getElementById('toolsButton'),
        sendButton: document.getElementById('sendButton'),
        stopButton: document.getElementById('stopButton'),
        
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsModal: document.getElementById('closeSettingsModal'),
        apiKeyInput: document.getElementById('apiKeyInput')
    };

    const state = {
        theme: localStorage.getItem('prasun_theme') || 'light',
        activeModel: 'prasun-4',
        attachedFile: null,
        isGenerating: false,
        abortController: null,
        toolsEnabled: false,
        isListening: false,
        recognition: null
    };

    function init() {
        applyTheme(state.theme);
        setupEventListeners();
        setupSpeechRecognition();
        updateSendButtonState();
    }

    function applyTheme(theme) {
        state.theme = theme;
        localStorage.setItem('prasun_theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (elements.themeColorMeta) elements.themeColorMeta.content = '#171717';
        } else {
            document.body.classList.remove('dark-theme');
            if (elements.themeColorMeta) elements.themeColorMeta.content = '#ffffff';
        }
    }

    function toggleTheme() {
        applyTheme(state.theme === 'light' ? 'dark' : 'light');
    }

    function toggleSidebar(show) {
        const isOpen = show !== undefined ? show : !elements.sidebar.classList.contains('active');
        elements.sidebar.classList.toggle('active', isOpen);
        elements.sidebarOverlay.classList.toggle('active', isOpen);
    }

    function handleInputResize() {
        elements.messageInput.style.height = 'auto';
        const newHeight = Math.min(elements.messageInput.scrollHeight, 180);
        elements.messageInput.style.height = `${newHeight}px`;
        updateSendButtonState();
    }

    function updateSendButtonState() {
        const hasText = elements.messageInput.value.trim().length > 0;
        const hasFile = state.attachedFile !== null;
        elements.sendButton.disabled = !(hasText || hasFile) || state.isGenerating;
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!elements.sendButton.disabled) {
                sendMessage();
            }
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        state.attachedFile = file;
        elements.attachmentName.textContent = file.name;
        elements.attachmentSize.textContent = formatFileSize(file.size);
        elements.attachmentPreview.hidden = false;
        updateSendButtonState();
    }

    function removeAttachment() {
        state.attachedFile = null;
        elements.fileInput.value = '';
        elements.attachmentPreview.hidden = true;
        updateSendButtonState();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (elements.voiceButton) elements.voiceButton.style.display = 'none';
            return;
        }

        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = true;

        state.recognition.onstart = () => {
            state.isListening = true;
            elements.voiceButton.classList.add('listening');
        };

        state.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            elements.messageInput.value = transcript;
            handleInputResize();
        };

        state.recognition.onerror = () => stopListening();
        state.recognition.onend = () => stopListening();
    }

    function toggleVoiceInput() {
        if (!state.recognition) return;
        if (state.isListening) {
            state.recognition.stop();
        } else {
            state.recognition.start();
        }
    }

    function stopListening() {
        state.isListening = false;
        if (elements.voiceButton) elements.voiceButton.classList.remove('listening');
    }

    function sendMessage(customPrompt = null) {
        const text = customPrompt || elements.messageInput.value.trim();
        if ((!text && !state.attachedFile) || state.isGenerating) return;

        // Hide welcome screen
        if (elements.welcomeScreen) {
            elements.welcomeScreen.style.display = 'none';
        }

        // Render User Message
        appendMessage('user', text, state.attachedFile);

        // Reset Input
        elements.messageInput.value = '';
        handleInputResize();
        if (state.attachedFile) removeAttachment();

        // Generate AI Response
        generateAiResponse(text);
    }

    function appendMessage(role, text, file = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${role}`;

        let contentHtml = '';
        if (file) {
            contentHtml += `<div style="margin-bottom: 6px;"><span class="attachment-chip">📎 ${escapeHtml(file.name)}</span></div>`;
        }

        contentHtml += `<div class="message-text">${formatMessageText(text)}</div>`;

        messageEl.innerHTML = `
            <div class="message-avatar">${role === 'user' ? 'P' : '✦'}</div>
            <div class="message-content">${contentHtml}</div>
        `;

        elements.messages.appendChild(messageEl);
        scrollToBottom();
        return messageEl;
    }

    // Smart Contextual Response Engine
    function getContextualResponse(prompt) {
        const q = (prompt || '').toLowerCase().trim();

        if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
            return `Hello! How can I assist you today? Feel free to ask a question, request code, or explore a topic like solar energy or web design.`;
        }
        
        if (q.includes('solar')) {
            return `**Solar Energy** is radiant light and heat from the Sun that is harnessed using a range of technologies such as solar power to generate electricity.\n\n### Key Highlights:\n- **Photovoltaic (PV) Cells**: Convert sunlight directly into electricity.\n- **Renewable & Clean**: Reduces carbon emissions drastically.\n- **Efficiency**: Modern residential solar panels typically operate between 18% and 22% efficiency.`;
        }

        if (q.includes('javascript') || q.includes('code') || q.includes('js')) {
            return `JavaScript is a versatile programming language used for both client-side and server-side web development.\n\n\`\`\`javascript\n// Simple JavaScript Example\nconst greetUser = (name) => {\n  console.log(\`Welcome to Prasun AI, \${name}!\`);\n};\n\ngreetUser('Developer');\n\`\`\``;
        }

        if (q.includes('website') || q.includes('html') || q.includes('css')) {
            return `Building a clean website requires three core pillars:\n\n1. **HTML5**: For semantic layout and page structure.\n2. **CSS3**: For responsive design, layout flex/grid, and theme variables.\n3. **JavaScript**: For interactive UI components and state management.`;
        }

        return `Here is what I found regarding **"${prompt}"**:\n\nThis is a custom response generated for your prompt. You can now wire this ` + '`generateAiResponse`' + ` function directly to an API endpoint (like OpenAI or Claude) to stream live responses!`;
    }

    function generateAiResponse(userPrompt) {
        state.isGenerating = true;
        setGenerationUI(true);

        const aiMessageEl = document.createElement('div');
        aiMessageEl.className = 'message message-assistant';
        aiMessageEl.innerHTML = `
            <div class="message-avatar">✦</div>
            <div class="message-content">
                <div class="message-text"><span class="typing-cursor"></span></div>
            </div>
        `;

        elements.messages.appendChild(aiMessageEl);
        const textContainer = aiMessageEl.querySelector('.message-text');
        scrollToBottom();

        const fullResponse = getContextualResponse(userPrompt);
        let currentIndex = 0;

        state.abortController = setInterval(() => {
            if (currentIndex < fullResponse.length) {
                currentIndex += Math.floor(Math.random() * 4) + 2;
                const chunk = fullResponse.slice(0, currentIndex);
                textContainer.innerHTML = formatMessageText(chunk) + '<span class="typing-cursor"></span>';
                scrollToBottom();
            } else {
                stopGeneration(fullResponse);
            }
        }, 25);
    }

    function stopGeneration(finalText = null) {
        if (state.abortController) {
            clearInterval(state.abortController);
            state.abortController = null;
        }

        const lastMessage = elements.messages.querySelector('.message-assistant:last-child .message-text');
        if (lastMessage) {
            const cursor = lastMessage.querySelector('.typing-cursor');
            if (cursor) cursor.remove();
            if (finalText) {
                lastMessage.innerHTML = formatMessageText(finalText);
            }
        }

        state.isGenerating = false;
        setGenerationUI(false);
    }

    function setGenerationUI(generating) {
        elements.sendButton.hidden = generating;
        elements.stopButton.hidden = !generating;
        updateSendButtonState();
    }

    function formatMessageText(text) {
        if (!text) return '';
        let formatted = escapeHtml(text)
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        return formatted;
    }

    function escapeHtml(string) {
        return String(string)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function scrollToBottom() {
        elements.chatArea.scrollTop = elements.chatArea.scrollHeight;
    }

    function clearChat() {
        elements.messages.innerHTML = '';
        if (elements.welcomeScreen) elements.welcomeScreen.style.display = 'flex';
    }

    function setupEventListeners() {
        elements.openSidebar?.addEventListener('click', () => toggleSidebar(true));
        elements.closeSidebar?.addEventListener('click', () => toggleSidebar(false));
        elements.sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

        elements.newChatButton?.addEventListener('click', () => {
            clearChat();
            if (window.innerWidth <= 768) toggleSidebar(false);
        });

        elements.clearChatButton?.addEventListener('click', clearChat);

        elements.messageInput?.addEventListener('input', handleInputResize);
        elements.messageInput?.addEventListener('keydown', handleKeyDown);

        elements.sendButton?.addEventListener('click', () => sendMessage());
        elements.stopButton?.addEventListener('click', () => stopGeneration());

        elements.attachButton?.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput?.addEventListener('change', handleFileSelect);
        elements.removeAttachment?.addEventListener('click', removeAttachment);

        elements.voiceButton?.addEventListener('click', toggleVoiceInput);

        elements.themeButton?.addEventListener('click', toggleTheme);

        elements.suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                if (prompt) sendMessage(prompt);
            });
        });

        elements.modelSelector?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = elements.modelDropdown.hidden;
            elements.modelDropdown.hidden = !isHidden;
            elements.modelSelector.setAttribute('aria-expanded', isHidden);
        });

        document.querySelectorAll('.model-option').forEach(option => {
            option.addEventListener('click', () => {
                const selectedModel = option.getAttribute('data-model');
                const modelNameText = option.querySelector('strong').textContent;

                document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                state.activeModel = selectedModel;
                elements.modelName.textContent = modelNameText;
                elements.modelDropdown.hidden = true;
                elements.modelSelector.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (!elements.modelSelector?.contains(e.target)) {
                if (elements.modelDropdown) elements.modelDropdown.hidden = true;
                elements.modelSelector?.setAttribute('aria-expanded', 'false');
            }
        });

        elements.settingsButton?.addEventListener('click', () => elements.settingsModal?.showModal());
        elements.closeSettingsModal?.addEventListener('click', () => elements.settingsModal?.close());

        elements.chatSearch?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.history-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        });
    }

    init();
});
