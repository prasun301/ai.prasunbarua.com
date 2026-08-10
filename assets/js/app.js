document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Toggle Logic
  const sidebar = document.getElementById('sidebar');
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
  }

  if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // Theme Toggle Logic
  const themeButton = document.getElementById('themeButton');
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      const iconSpan = themeButton.querySelector('.material-symbols-outlined');
      const textSpan = themeButton.querySelector('span:last-child');
      
      if (iconSpan) iconSpan.textContent = isDark ? 'light_mode' : 'dark_mode';
      if (textSpan) textSpan.textContent = isDark ? 'Light mode' : 'Appearance';
    });
  }

  // Settings Modal Logic
  const settingsBtn = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModal = document.getElementById('closeSettingsModal');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => settingsModal.showModal());
  }

  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => settingsModal.close());
  }

  // Model Selector Dropdown Logic
  const modelSelectorBtn = document.getElementById('modelSelector');
  const modelDropdown = document.getElementById('modelDropdown');

  if (modelSelectorBtn && modelDropdown) {
    modelSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = modelDropdown.hidden;
      modelDropdown.hidden = !isHidden;
      modelSelectorBtn.setAttribute('aria-expanded', !isHidden);
    });

    document.addEventListener('click', () => {
      modelDropdown.hidden = true;
      modelSelectorBtn.setAttribute('aria-expanded', 'false');
    });

    modelDropdown.querySelectorAll('.model-option').forEach(option => {
      option.addEventListener('click', () => {
        modelDropdown.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const modelName = option.querySelector('strong')?.textContent || 'Gemini';
        const modelBtnText = modelSelectorBtn.querySelector('.model-name');
        if (modelBtnText) modelBtnText.textContent = modelName;
        modelDropdown.hidden = true;
      });
    });
  }

  // Chat Elements
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesContainer = document.getElementById('messages');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const newChatButton = document.getElementById('newChatButton');
  const clearChatButton = document.getElementById('clearChatButton');

  // Gemini API Request
  async function getGeminiResponse(query) {
    const API_KEY = 'AIzaSyCbhcI0F5R3vmQByBZVozcwgBSJe-TDCFI'; // Replace with your actual API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        return `API Error: ${data.error.message}`;
      } else {
        return "Received an unexpected response format from Gemini.";
      }
    } catch (error) {
      return "Network error: Unable to connect to Gemini API.";
    }
  }

  // Markdown & LaTeX Parser
  function parseMarkdown(text) {
    if (!text) return '';

    // Convert LaTeX math expressions ($30\frac{3}{4}$ -> 30 3/4)
    let cleaned = text.replace(/\$([^$]+)\$/g, (match, formula) => {
      let cleanMath = formula
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        .replace(/\\/g, '')
        .trim();
      return `<strong>${cleanMath}</strong>`;
    });

    // Use marked.js if available, otherwise apply basic fallback
    if (typeof marked !== 'undefined') {
      return marked.parse(cleaned);
    }

    return cleaned
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // Send Message
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    if (welcomeScreen) welcomeScreen.style.display = 'none';

    // Render User Message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'user-message-wrapper';
    userMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;';
    userMsgDiv.innerHTML = `
      <div style="background-color: var(--hover-bg, #f1f3f4); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word;">
        ${parseMarkdown(text)}
      </div>
    `;
    messagesContainer.appendChild(userMsgDiv);

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Render Thinking Indicator
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.className = 'ai-message-wrapper';
    aiMsgDiv.style.cssText = 'margin-bottom: 24px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
    aiMsgDiv.innerHTML = `
      <div style="width: 32px; height: 32px; background-color: #1a73e8; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span>
      </div>
      <div id="loadingBubble" style="background-color: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e0e0e0); padding: 14px 18px; border-radius: 16px; max-width: 85%; line-height: 1.6;">
        Thinking...
      </div>
    `;
    messagesContainer.appendChild(aiMsgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Fetch API Response
    const rawAiResponse = await getGeminiResponse(text);
    
    // Update Bubble with Parsed Response
    const bubbleContent = aiMsgDiv.querySelector('#loadingBubble');
    bubbleContent.innerHTML = parseMarkdown(rawAiResponse);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Event Listeners
  if (messageInput && sendButton) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      sendButton.disabled = messageInput.value.trim() === '';
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) sendMessage();
      }
    });

    sendButton.addEventListener('click', sendMessage);
  }

  // New & Clear Chat Buttons
  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
      if (messageInput) {
        messageInput.value = '';
        messageInput.style.height = 'auto';
        if (sendButton) sendButton.disabled = true;
      }
    });
  }

  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
    });
  }

  // Prompt Suggestion Cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.getAttribute('data-prompt');
      if (messageInput) {
        messageInput.value = promptText;
        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;
        if (sendButton) sendButton.disabled = false;
        sendMessage();
      }
    });
  });
});
