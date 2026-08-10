/**
 * Prasun AI — Main Application Logic
 * Modern, event-driven JavaScript implementation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. DOM Elements
    // =========================================================================
    const elements = {
        // Layout & Navigation
        app: document.querySelector('.app'),
        sidebar: document.getElementById('sidebar'),
        openSidebar: document.getElementById('openSidebar'),
        closeSidebar: document.getElementById('closeSidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        
        // Chat History & Search
        newChatButton: document.getElementById('newChatButton'),
        chatSearch: document.getElementById('chatSearch'),
        historyContainer: document.getElementById('historyContainer'),
        
        // Topbar Controls
        modelSelector: document.getElementById('modelSelector'),
        modelDropdown: document.getElementById('modelDropdown'),
        modelName: document.querySelector('.model-name'),
        clearChatButton: document.getElementById('clearChatButton'),
        shareButton: document.getElementById('shareButton'),
        
        // Sidebar Bottom
        themeButton: document.getElementById('themeButton'),
        themeColorMeta: document.getElementById('themeColor'),
        settingsButton: document.getElementById('settingsButton'),
        userProfile: document.getElementById('userProfile'),
        
        // Chat Area
        chatArea: document.getElementById('chatArea'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        messages: document.getElementById('messages'),
        suggestionCards: document.querySelectorAll('.suggestion-card'),
        
        // Composer & Attachments
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
        
        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsModal: document.getElementById('closeSettingsModal'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        streamToggle: document.getElementById('streamToggle')
    };

    // =========================================================================
    // 2. Application State
    // =========================================================================
    const state = {
        theme: localStorage.getItem('prasun_theme') || 'light',
        activeModel: 'prasun-4',
        attachedFile: null,
        isGenerating: false,
        abortController: null,
        toolsEnabled: false,
        isListening: false,
        messagesList: [],
        recognition: null
    };

    // =========================================================================
    // 3. Initialization
    // =========================================================================
    function init() {
        applyTheme(state.theme);
        setupEventListeners();
        setupSpeechRecognition();
        updateSendButtonState();
    }

    // =========================================================================
    // 4. Theme & Appearance
    // =========================================================================
    function applyTheme(theme) {
        state.theme = theme;
        localStorage.setItem('prasun_theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (elements.themeColorMeta) elements.themeColorMeta.content = '#121212';
        } else {
            document.body.classList.remove('dark-theme');
            if (elements.themeColorMeta) elements.themeColorMeta.content = '#ffffff';
        }
    }

    function toggleTheme() {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    }

    // =========================================================================
    // 5. Sidebar & Navigation Logic
    // =========================================================================
    function toggleSidebar(show) {
        const isOpen = show !== undefined ? show : !elements.sidebar.classList.contains('active');
        elements.sidebar.classList.toggle('active', isOpen);
        elements.sidebarOverlay.classList.toggle('active', isOpen);
    }

    // =========================================================================
    // 6. Composer & Textarea Operations
    // =========================================================================
    function handleInputResize() {
        elements.messageInput.style.height = 'auto';
        const newHeight = Math.min(elements.messageInput.scrollHeight, 200);
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

    // =========================================================================
    // 7. File Attachment Logic
    // =========================================================================
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

    // =========================================================================
    // 8. Speech Recognition (Voice Input)
    // =========================================================================
    function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            elements.voiceButton.style.display = 'none';
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
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            elements.messageInput.value = transcript;
            handleInputResize();
        };

        state.recognition.onerror = () => {
            stopListening();
        };

        state.recognition.onend = () => {
            stopListening();
        };
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
        elements.voiceButton.classList.remove('listening');
    }

    // =========================================================================
    // 9. Messaging & AI Streaming Logic
    // =========================================================================
    function sendMessage(customPrompt = null) {
        const text = customPrompt || elements.messageInput.value.trim();
        if ((!text && !state.attachedFile) || state.isGenerating) return;

        // Hide welcome screen on first message
        if (elements.welcomeScreen.style.display !== 'none') {
            elements.welcomeScreen.style.display = 'none';
        }

        // Render User Message
        appendMessage('user', text, state.attachedFile);

        // Reset Input & Attachments
        elements.messageInput.value = '';
        handleInputResize();
        if (state.attachedFile) removeAttachment();

        // Trigger AI Stream Simulation
        generateAiResponse(text);
    }

    function appendMessage(role, text, file = null) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${role}`;

        let contentHtml = '';

        if (file) {
            contentHtml += `
                <div class="message-attachment">
                    <span class="attachment-chip">📎 ${escapeHtml(file.name)}</span>
                </div>
            `;
        }

        contentHtml += `<div class="message-text">${formatMessageText(text)}</div>`;

        messageEl.innerHTML = `
            <div class="message-avatar">${role === 'user' ? 'P' : '✦'}</div>
            <div class="message-content">${contentHtml}</div>
        `;

        elements.messages.appendChild(messageEl);
        scrollToBottom();

        state.messagesList.push({ role, text });
        return messageEl;
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

        // Simulated Streaming Response
        const sampleResponses = [
            `I'd be happy to help you with that! Here is a breakdown of what you asked about:\n\n1. **Key Concept**: Fast and reliable responses.\n2. **Execution**: Clean code design and optimal structure.\n\nLet me know if you would like me to dive deeper into any specific detail!`,
            `That's a great question regarding **${userPrompt || 'your request'}**.\n\nHere is a quick summary:\n- Flexible layout built with modern HTML5.\n- Seamless dark/light theme switching.\n- Interactive controls ready for API integration.`,
            `Here is a JavaScript solution for your implementation:\n\n\`\`\`javascript\n// Simple Async Helper Function\nasync function fetchData(url) {\n  const response = await fetch(url);\n  return await response.json();\n}\n\`\`\`\n\nIs there anything else you'd like to customize?`
        ];

        const fullResponse = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
        let currentIndex = 0;

        state.abortController = setInterval(() => {
            if (currentIndex < fullResponse.length) {
                currentIndex += Math.floor(Math.random() * 3) + 1;
                const chunk = fullResponse.slice(0, currentIndex);
                textContainer.innerHTML = formatMessageText(chunk) + '<span class="typing-cursor"></span>';
                scrollToBottom();
            } else {
                stopGeneration(fullResponse);
            }
        }, 30);
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
        // Basic Markdown parser for code blocks, bold, linebreaks
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
        elements.welcomeScreen.style.display = 'flex';
        state.messagesList = [];
    }

    // =========================================================================
    // 10. Event Listeners Setup
    // =========================================================================
    function setupEventListeners() {
        // Mobile Sidebar Toggles
        elements.openSidebar?.addEventListener('click', () => toggleSidebar(true));
        elements.closeSidebar?.addEventListener('click', () => toggleSidebar(false));
        elements.sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

        // New Chat & Clear Chat
        elements.newChatButton?.addEventListener('click', () => {
            clearChat();
            if (window.innerWidth <= 768) toggleSidebar(false);
        });

        elements.clearChatButton?.addEventListener('click', clearChat);

        // Input & Typing
        elements.messageInput?.addEventListener('input', handleInputResize);
        elements.messageInput?.addEventListener('keydown', handleKeyDown);

        // Send & Stop Buttons
        elements.sendButton?.addEventListener('click', () => sendMessage());
        elements.stopButton?.addEventListener('click', () => stopGeneration());

        // File Attachments
        elements.attachButton?.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput?.addEventListener('change', handleFileSelect);
        elements.removeAttachment?.addEventListener('click', removeAttachment);

        // Voice Input
        elements.voiceButton?.addEventListener('click', toggleVoiceInput);

        // Tools Toggle
        elements.toolsButton?.addEventListener('click', () => {
            state.toolsEnabled = !state.toolsEnabled;
            elements.toolsButton.classList.toggle('active', state.toolsEnabled);
        });

        // Theme Toggle
        elements.themeButton?.addEventListener('click', toggleTheme);

        // Suggestion Cards
        elements.suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                if (prompt) sendMessage(prompt);
            });
        });

        // Model Selector Dropdown
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

        // Close Dropdowns on Click Outside
        document.addEventListener('click', (e) => {
            if (!elements.modelSelector?.contains(e.target)) {
                if (elements.modelDropdown) elements.modelDropdown.hidden = true;
                elements.modelSelector?.setAttribute('aria-expanded', 'false');
            }
        });

        // Settings Modal
        elements.settingsButton?.addEventListener('click', () => elements.settingsModal?.showModal());
        elements.closeSettingsModal?.addEventListener('click', () => elements.settingsModal?.close());

        // Chat Search Filter
        elements.chatSearch?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.history-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(query) ? 'flex' : 'none';
            });
        });

        // Keyboard Shortcut: Cmd/Ctrl + K to focus search
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                elements.chatSearch?.focus();
            }
        });

        // Share Action
        elements.shareButton?.addEventListener('click', () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Conversation link copied to clipboard!');
            }
        });
    }

    // Start App
    init();
});
