document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Toggle Logic
  const sidebar = document.getElementById('sidebar');
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function toggleSidebar() {
    sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
  }

  if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // Theme / Appearance Toggle Logic
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
    settingsBtn.addEventListener('click', () => {
      settingsModal.showModal();
    });
  }

  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => {
      settingsModal.close();
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (event) => {
      const rect = settingsModal.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        settingsModal.close();
      }
    });
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
        const modelName = option.querySelector('strong').textContent;
        const modelBtnText = modelSelectorBtn.querySelector('.model-name');
        if (modelBtnText) modelBtnText.textContent = modelName;
        modelDropdown.hidden = true;
      });
    });
  }

  // Chat Functionality
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesContainer = document.getElementById('messages');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const newChatButton = document.getElementById('newChatButton');
  const clearChatButton = document.getElementById('clearChatButton');

  // Real Gemini API Integration
  async function getGeminiResponse(query) {
    const API_KEY = 'AIzaSyCbhcI0F5R3vmQByBZVozcwgBSJe-TDCFI'; // Replace with your actual API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }]
        })
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
      return "Network error: Unable to connect to Gemini API. Check your internet connection or API key.";
    }
  }

  // Modern Markdown Parser
  function parseMarkdown(text) {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let lines = escaped.split('\n');
    let htmlResult = [];

    lines.forEach(line => {
      let trimmed = line.trim();
      let formattedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (/^\d+\.\s/.test(trimmed)) {
        let content = formattedLine.replace(/^\d+\.\s*/, '');
        htmlResult.push(`<div style="margin: 6px 0 6px 16px;">• ${content}</div>`);
      } else if (/^[\*\-]\s/.test(trimmed)) {
        let content = formattedLine.replace(/^[\*\-]\s*/, '');
        htmlResult.push(`<div style="margin: 6px 0 6px 16px;">• ${content}</div>`);
      } else if (trimmed.length > 0) {
        htmlResult.push(`<p style="margin-bottom: 8px;">${formattedLine}</p>`);
      }
    });

    return htmlResult.join('');
  }

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    if (welcomeScreen) {
      welcomeScreen.style.display = 'none';
    }

    // Append User Message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;';
    userMsgDiv.innerHTML = `
      <div style="background-color: var(--hover-bg); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word; font-size: 0.95rem; color: var(--text-primary);">
        ${parseMarkdown(text)}
      </div>
    `;
    messagesContainer.appendChild(userMsgDiv);

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show loading state or temporary placeholder while waiting for Gemini
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.style.cssText = 'margin-bottom: 24px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
    aiMsgDiv.innerHTML = `
      <div style="width: 32px; height: 32px; background-color: var(--accent-color); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span>
      </div>
      <div id="loadingBubble" style="background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 16px; color: var(--text-muted); font-size: 0.95rem;">
        Thinking...
      </div>
    `;
    messagesContainer.appendChild(aiMsgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Fetch live response from Gemini API
    const rawAiResponse = await getGeminiResponse(text);
    
    // Update bubble with actual response
    const bubbleContent = aiMsgDiv.querySelector('#loadingBubble');
    bubbleContent.style.color = 'var(--text-primary)';
    bubbleContent.style.lineHeight = '1.6';
    bubbleContent.innerHTML = parseMarkdown(rawAiResponse);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  if (messageInput && sendButton) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      sendButton.disabled = messageInput.value.trim() === '';
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
          sendMessage();
        }
      }
    });

    sendButton.addEventListener('click', () => {
      sendMessage();
    });
  }

  // New Chat Button Logic
  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
      }
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
      if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
      }
    });
  }

  // Suggestion Cards Click Handling
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.getAttribute('data-prompt');
      if (messageInput) {
        messageInput.value = promptText;
        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;
        if (sendButton) sendButton.disabled = false;
        messageInput.focus();
        sendMessage();
      }
    });
  });

  // History Actions Logic
  document.querySelectorAll('.history-item').forEach(item => {
    const editBtn = item.querySelector('[title="Rename"]');
    const deleteBtn = item.querySelector('[title="Delete"]');

    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const titleSpan = item.querySelector('.history-item-left span:last-child');
        const newTitle = prompt('Rename chat:', titleSpan.textContent);
        if (newTitle) titleSpan.textContent = newTitle;
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
          item.remove();
        }
      });
    }
  });
});
