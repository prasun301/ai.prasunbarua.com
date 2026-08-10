/**
 * Prasun AI — Client Engine
 * Real integration with Cloudflare Pages Functions (/api/chat) & Gemini
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // Storage Keys
  const STORAGE_KEY_CONVERSATIONS = 'prasun_ai_conversations_v2';
  const STORAGE_KEY_ACTIVE_ID = 'prasun_ai_active_id_v2';
  const STORAGE_KEY_THEME = 'prasun_ai_theme';

  // State Management
  const state = {
    conversations: [],
    activeChatId: null,
    theme: localStorage.getItem(STORAGE_KEY_THEME) || 'light',
    isGenerating: false,
    abortController: null,
    speechRecognition: null,
    isListening: false
  };

  // DOM Elements
  const els = {
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
    messagesList: document.getElementById('messages'),
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
    toastContainer: document.getElementById('toastContainer')
  };

  // Initialize Application
  function init() {
    applyTheme(state.theme);
    loadConversationsFromStorage();
    setupEventListeners();
    setupSpeechRecognition();
    updateSendButtonState();
  }

  // Theme Management
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (els.themeColorMeta) els.themeColorMeta.content = '#171717';
    } else {
      document.body.classList.remove('dark-theme');
      if (els.themeColorMeta) els.themeColorMeta.content = '#ffffff';
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  // Sidebar Controls
  function toggleSidebar(show) {
    const isOpen = show !== undefined ? show : !els.sidebar.classList.contains('active');
    els.sidebar.classList.toggle('active', isOpen);
    els.sidebarOverlay.classList.toggle('active', isOpen);
    els.sidebarOverlay.setAttribute('aria-hidden', !isOpen);
  }

  // LocalStorage Persistence
  function loadConversationsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      state.conversations = stored ? JSON.parse(stored) : [];
      state.activeChatId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || null;
    } catch (e) {
      console.error('Failed to parse localStorage conversations:', e);
      state.conversations = [];
      state.activeChatId = null;
    }

    if (state.activeChatId && getActiveConversation()) {
      renderActiveConversation();
    } else if (state.conversations.length > 0) {
      state.activeChatId = state.conversations[0].id;
      renderActiveConversation();
    } else {
      startNewChat(false);
    }

    renderHistorySidebar();
  }

  function saveConversationsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(state.conversations));
      if (state.activeChatId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, state.activeChatId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch (e) {
      console.error('Failed to save conversations to localStorage:', e);
    }
  }

  function getActiveConversation() {
    return state.conversations.find(c => c.id === state.activeChatId);
  }

  function createConversation(firstUserMessageText) {
    const title = firstUserMessageText.slice(0, 32) + (firstUserMessageText.length > 32 ? '...' : '');
    const newConv = {
      id: 'conv_' + Date.now(),
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };
    state.conversations.unshift(newConv);
    state.activeChatId = newConv.id;
    saveConversationsToStorage();
    renderHistorySidebar();
    return newConv;
  }

  function startNewChat(shouldRender = true) {
    state.activeChatId = null;
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    if (shouldRender) {
      els.messagesList.innerHTML = '';
      els.welcomeScreen.style.display = 'flex';
      renderHistorySidebar();
    }
  }

  // Sidebar History UI Rendering
  function renderHistorySidebar() {
    if (!els.historyContainer) return;
    els.historyContainer.innerHTML = '';

    if (state.conversations.length === 0) {
      els.historyContainer.innerHTML = '<div style="padding:12px; font-size:0.8rem; color:var(--text-muted);">No chat history yet</div>';
      return;
    }

    const titleHeader = document.createElement('div');
    titleHeader.className = 'history-group-title';
    titleHeader.textContent = 'Recent Chats';
    els.historyContainer.appendChild(titleHeader);

    state.conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = `history-item ${conv.id === state.activeChatId ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="history-item-content">
          <span>💬</span>
          <span class="history-item-title">${escapeHtml(conv.title)}</span>
        </div>
        <div class="history-item-actions">
          <button class="history-action-btn delete-btn" title="Delete conversation">🗑️</button>
        </div>
      `;

      item.querySelector('.history-item-content').addEventListener('click', () => {
        state.activeChatId = conv.id;
        saveConversationsToStorage();
        renderActiveConversation();
        renderHistorySidebar();
        if (window.innerWidth <= 768) toggleSidebar(false);
      });

      item.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      els.historyContainer.appendChild(item);
    });
  }

  function deleteConversation(id) {
    state.conversations = state.conversations.filter(c => c.id !== id);
    if (state.activeChatId === id) {
      state.activeChatId = state.conversations.length > 0 ? state.conversations[0].id : null;
    }
    saveConversationsToStorage();
    if (state.activeChatId) {
      renderActiveConversation();
    } else {
      startNewChat(true);
    }
    renderHistorySidebar();
  }

  function renderActiveConversation() {
    const conv = getActiveConversation();
    els.messagesList.innerHTML = '';

    if (!conv || conv.messages.length === 0) {
      els.welcomeScreen.style.display = 'flex';
      return;
    }

    els.welcomeScreen.style.display = 'none';
    conv.messages.forEach(msg => {
      appendMessageToDOM(msg.role, msg.content);
    });
    scrollToBottom();
  }

  // Message Input & Send Logic
  function handleInputResize() {
    els.messageInput.style.height = 'auto';
    const newHeight = Math.min(els.messageInput.scrollHeight, 180);
    els.messageInput.style.height = `${newHeight}px`;
    updateSendButtonState();
  }

  function updateSendButtonState() {
    const hasText = els.messageInput.value.trim().length > 0;
    els.sendButton.disabled = !hasText || state.isGenerating;
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!els.sendButton.disabled) {
        sendMessage();
      }
    }
  }

  // REAL API Communication via POST /api/chat
  async function sendMessage(promptOverride = null) {
    const text = (promptOverride || els.messageInput.value).trim();
    if (!text || state.isGenerating) return;

    let conv = getActiveConversation();
    if (!conv) {
      conv = createConversation(text);
    }

    // Append User Message to State & DOM
    conv.messages.push({ role: 'user', content: text });
    saveConversationsToStorage();

    els.welcomeScreen.style.display = 'none';
    appendMessageToDOM('user', text);

    els.messageInput.value = '';
    handleInputResize();

    // Prepare Assistant Loading Bubble
    state.isGenerating = true;
    setGeneratingUI(true);

    const assistantMsgEl = appendMessageToDOM('assistant', '');
    const textContainer = assistantMsgEl.querySelector('.message-text');
    textContainer.innerHTML = '<span class="typing-cursor"></span>';

    // Create real AbortController
    state.abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conv.messages }),
        signal: state.abortController.signal
      });

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponseText = data.response || "No response text received.";

      // Update State & UI with final AI output
      conv.messages.push({ role: 'assistant', content: aiResponseText });
      saveConversationsToStorage();

      textContainer.innerHTML = formatMarkdownSafely(aiResponseText);

    } catch (err) {
      if (err.name === 'AbortError') {
        textContainer.innerHTML = '<em>Generation stopped by user.</em>';
      } else {
        console.error('Chat API Error:', err);
        textContainer.innerHTML = `<span style="color: #ef4444;">Sorry, couldn't generate a response: ${escapeHtml(err.message)}</span>`;
      }
    } finally {
      state.isGenerating = false;
      state.abortController = null;
      setGeneratingUI(false);
      scrollToBottom();
      renderHistorySidebar();
    }
  }

  function stopGeneration() {
    if (state.abortController) {
      state.abortController.abort();
    }
  }

  function setGeneratingUI(generating) {
    els.sendButton.hidden = generating;
    els.stopButton.hidden = !generating;
    updateSendButtonState();
  }

  // DOM Message Append Helper
  function appendMessageToDOM(role, content) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${role}`;

    const formattedContent = content ? formatMarkdownSafely(content) : '';

    messageEl.innerHTML = `
      <div class="message-avatar">${role === 'user' ? 'P' : '✦'}</div>
      <div class="message-content">
        <div class="message-text">${formattedContent}</div>
      </div>
    `;

    els.messagesList.appendChild(messageEl);
    scrollToBottom();
    return messageEl;
  }

  // XSS-Safe Markdown Formatter
  function formatMarkdownSafely(text) {
    if (!text) return '';

    // Step 1: Escape code blocks temporarily to prevent double escaping
    const codeBlocks = [];
    let placeholderText = text.replace(/```([\s\S]*?)```/g, (match, codeContent) => {
      const id = `___CODE_BLOCK_${codeBlocks.length}___`;
      codeBlocks.push(codeContent);
      return id;
    });

    // Step 2: Escape HTML in remaining text
    let safeText = escapeHtml(placeholderText);

    // Step 3: Apply safe Markdown transformations
    safeText = safeText
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    // Step 4: Re-insert escaped code blocks
    codeBlocks.forEach((code, index) => {
      const codeHtml = `<pre><code>${escapeHtml(code)}</code></pre>`;
      safeText = safeText.replace(`___CODE_BLOCK_${index}___`, codeHtml);
    });

    return safeText;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function scrollToBottom() {
    els.chatArea.scrollTop = els.chatArea.scrollHeight;
  }

  // Speech Recognition (Optional Web Feature)
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (els.voiceButton) els.voiceButton.style.display = 'none';
      return;
    }

    state.speechRecognition = new SpeechRecognition();
    state.speechRecognition.continuous = false;
    state.speechRecognition.interimResults = true;

    state.speechRecognition.onstart = () => {
      state.isListening = true;
      els.voiceButton.classList.add('active');
    };

    state.speechRecognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');
      els.messageInput.value = transcript;
      handleInputResize();
    };

    state.speechRecognition.onerror = () => stopSpeech();
    state.speechRecognition.onend = () => stopSpeech();
  }

  function toggleSpeech() {
    if (!state.speechRecognition) return;
    if (state.isListening) {
      state.speechRecognition.stop();
    } else {
      state.speechRecognition.start();
    }
  }

  function stopSpeech() {
    state.isListening = false;
    if (els.voiceButton) els.voiceButton.classList.remove('active');
  }

  function showToast(message) {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Event Listeners Setup
  function setupEventListeners() {
    els.openSidebar?.addEventListener('click', () => toggleSidebar(true));
    els.closeSidebar?.addEventListener('click', () => toggleSidebar(false));
    els.sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

    els.newChatButton?.addEventListener('click', () => {
      startNewChat(true);
      if (window.innerWidth <= 768) toggleSidebar(false);
    });

    els.clearChatButton?.addEventListener('click', () => {
      if (!state.activeChatId) return;
      if (confirm("Are you sure you want to clear this conversation?")) {
        deleteConversation(state.activeChatId);
      }
    });

    els.shareButton?.addEventListener('click', () => {
      const conv = getActiveConversation();
      if (!conv || conv.messages.length === 0) {
        showToast("No active conversation to share.");
        return;
      }
      const textSummary = conv.messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');
      
      navigator.clipboard.writeText(textSummary)
        .then(() => showToast("Conversation copied to clipboard!"))
        .catch(() => showToast("Failed to copy conversation."));
    });

    els.messageInput?.addEventListener('input', handleInputResize);
    els.messageInput?.addEventListener('keydown', handleKeyDown);

    els.sendButton?.addEventListener('click', () => sendMessage());
    els.stopButton?.addEventListener('click', stopGeneration);

    els.themeButton?.addEventListener('click', toggleTheme);

    els.suggestionCards.forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) sendMessage(prompt);
      });
    });

    // Model dropdown UI mapping
    els.modelSelector?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = els.modelDropdown.hidden;
      els.modelDropdown.hidden = !isHidden;
      els.modelSelector.setAttribute('aria-expanded', !isHidden);
    });

    document.querySelectorAll('.model-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const title = option.querySelector('strong').textContent;
        els.modelName.textContent = title;
        els.modelDropdown.hidden = true;
        els.modelSelector.setAttribute('aria-expanded', 'false');
        showToast(`Selected ${title} (Backend: Google Gemini 3 Flash)`);
      });
    });

    document.addEventListener('click', (e) => {
      if (!els.modelSelector?.contains(e.target)) {
        if (els.modelDropdown) els.modelDropdown.hidden = true;
        els.modelSelector?.setAttribute('aria-expanded', 'false');
      }
    });

    els.attachButton?.addEventListener('click', () => els.fileInput.click());
    els.fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast(`Attached ${file.name}. Note: Text input is prioritized for Gemini.`);
      }
    });

    els.toolsButton?.addEventListener('click', () => {
      showToast("Web search integration is coming soon.");
    });

    els.voiceButton?.addEventListener('click', toggleSpeech);

    els.settingsButton?.addEventListener('click', () => els.settingsModal?.showModal());
    els.closeSettingsModal?.addEventListener('click', () => els.settingsModal?.close());

    els.chatSearch?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll('.history-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
      });
    });
  }

  init();
});
