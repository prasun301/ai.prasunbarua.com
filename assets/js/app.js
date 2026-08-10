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

  // Real Gemini API Integration (Gemini 3.6 Flash)
  async function getGeminiResponse(query) {
    const API_KEY = 'AIzaSyYourActualKeyFromGoogleAIStudio...'; // Replace with your actual Google AI Studio API Key
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

  // Enhanced Inline & Block Markdown/LaTeX Parser
  function parseInlineMarkdown(text) {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italics
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // LaTeX Math / Fractions Cleaner (e.g. $26 \frac{4}{5}$ -> 26 4/5)
      .replace(/\$([^$]+)\$/g, (match, p1) => {
        let cleanMath = p1
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
          .replace(/\\s+/g, ' ');
        return `<span style="font-family: monospace; background: var(--hover-bg); padding: 2px 4px; border-radius: 4px;">${cleanMath}</span>`;
      });
  }

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

      // Handle Headings (###, ##, #)
      if (trimmed.startsWith('### ')) {
        let content = parseInlineMarkdown(trimmed.replace('### ', ''));
        htmlResult.push(`<h3 style="font-size: 1.1rem; font-weight: 600; margin: 14px 0 6px 0; color: var(--text-primary);">${content}</h3>`);
        return;
      }
      if (trimmed.startsWith('## ')) {
        let content = parseInlineMarkdown(trimmed.replace('## ', ''));
        htmlResult.push(`<h2 style="font-size: 1.25rem; font-weight: 600; margin: 16px 0 8px 0; color: var(--text-primary);">${content}</h2>`);
        return;
      }
      if (trimmed.startsWith('# ')) {
        let content = parseInlineMarkdown(trimmed.replace('# ', ''));
        htmlResult.push(`<h1 style="font-size: 1.4rem; font-weight: 700; margin: 18px 0 10px 0; color: var(--text-primary);">${content}</h1>`);
        return;
      }

      let formattedLine = parseInlineMarkdown(trimmed);

      // Handle Lists and Dividers
      if (/^\d+\.\s/.test(trimmed)) {
        let content = formattedLine.replace(/^\d+\.\s*/, '');
        htmlResult.push(`<div style="margin: 6px 0 6px 16px; display: flex; gap: 6px;"><span>•</span><span>${content}</span></div>`);
      } else if (/^[\*\-]\s/.test(trimmed)) {
        let content = formattedLine.replace(/^[\*\-]\s*/, '');
        htmlResult.push(`<div style="margin: 6px 0 6px 16px; display: flex; gap: 6px;"><span>•</span><span>${content}</span></div>`);
      } else if (trimmed === '---') {
        htmlResult.push(`<hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">`);
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

    // Show Loading Bubble
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
    
    // Update bubble with actual response parsed cleanly
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
