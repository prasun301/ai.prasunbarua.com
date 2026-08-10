document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 app.js initialized');

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  let selectedFilePart = null;
  let selectedFileName = '';
  let useGoogleSearch = true;

  // ==========================================
  // SIDEBAR HISTORY EDIT & DELETE HANDLERS
  // ==========================================
  const historyContainer = document.getElementById('historyContainer');
  if (historyContainer) {
    historyContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[title="Delete"]');
      const editBtn = e.target.closest('[title="Rename"]');
      const historyItem = e.target.closest('.history-item');

      if (!historyItem) return;

      if (deleteBtn) {
        e.stopPropagation();
        if (confirm('Delete this chat history item?')) {
          historyItem.remove();
        }
      }

      if (editBtn) {
        e.stopPropagation();
        const textSpan = historyItem.querySelector('.history-item-left span:last-child');
        if (textSpan) {
          const currentName = textSpan.textContent;
          const newName = prompt('Rename chat:', currentName);
          if (newName && newName.trim() !== '') {
            textSpan.textContent = newName.trim();
          }
        }
      }
    });
  }

  // ==========================================
  // 2. SAFE DOM SELECTORS (Prevents Script Crashes)
  // ==========================================
  const getEl = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Warning: Element with ID '${id}' not found in index.html`);
    return el;
  };

  const sidebar = getEl('sidebar');
  const openSidebarBtn = getEl('openSidebar');
  const closeSidebarBtn = getEl('closeSidebar');
  const sidebarOverlay = getEl('sidebarOverlay');

  const themeButton = getEl('themeButton');
  const settingsBtn = getEl('settingsButton');
  const settingsModal = getEl('settingsModal');
  const closeSettingsModal = getEl('closeSettingsModal');

  const modelSelectorBtn = getEl('modelSelector');
  const modelDropdown = getEl('modelDropdown');

  // Core Chat Elements (Crucial)
  const messageInput = getEl('messageInput') || getEl('userInput') || getEl('promptInput');
  const sendButton = getEl('sendButton') || getEl('submitBtn');
  const attachButton = getEl('attachButton');
  const fileInput = getEl('fileInput');
  const searchButton = getEl('searchButton');
  const messagesContainer = getEl('messages') || getEl('chatContainer');
  const welcomeScreen = getEl('welcomeScreen');
  const newChatButton = getEl('newChatButton');
  const clearChatButton = getEl('clearChatButton');

  // ==========================================
  // 3. UI CONTROLLERS
  // ==========================================

  // --- Sidebar Drawer ---
  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
  }

  if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // --- Theme Toggle ---
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

  // --- Settings Modal ---
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      if (typeof settingsModal.showModal === 'function') {
        settingsModal.showModal();
      } else {
        settingsModal.style.display = 'block';
      }
    });
  }

  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => {
      if (typeof settingsModal.close === 'function') {
        settingsModal.close();
      } else {
        settingsModal.style.display = 'none';
      }
    });
  }

  // --- Model Selector Dropdown ---
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
        const modelName = option.querySelector('strong')?.textContent || 'Gemini 3.6 Flash';
        const modelBtnText = modelSelectorBtn.querySelector('.model-name');
        if (modelBtnText) modelBtnText.textContent = modelName;
        modelDropdown.hidden = true;
      });
    });
  }

  // ==========================================
  // 4. FILE ATTACHMENTS
  // ==========================================

  let filePreviewBadge = document.getElementById('filePreviewBadge');
  if (!filePreviewBadge && messageInput && messageInput.parentElement) {
    filePreviewBadge = document.createElement('div');
    filePreviewBadge.id = 'filePreviewBadge';
    filePreviewBadge.style.cssText = `
      display: none;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      margin-bottom: 8px;
      background: var(--hover-bg, #f0f4f9);
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--text-primary, #1f1f1f);
      width: fit-content;
    `;
    messageInput.parentElement.insertBefore(filePreviewBadge, messageInput);
  }

  function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (attachButton && fileInput) {
    attachButton.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedFileName = file.name;
        selectedFilePart = await fileToGenerativePart(file);

        if (filePreviewBadge) {
          filePreviewBadge.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 16px;">attach_file</span>
            <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${selectedFileName}</span>
            <span class="material-symbols-outlined" id="removeFileBtn" style="font-size: 16px; cursor: pointer; margin-left: 4px;">close</span>
          `;
          filePreviewBadge.style.display = 'inline-flex';

          document.getElementById('removeFileBtn')?.addEventListener('click', clearFileAttachment);
        }

        if (attachButton) attachButton.style.color = '#1a73e8';
        if (sendButton) sendButton.disabled = false;
      }
    });
  }
if (searchButton) {
    // Default to active state on load
    searchButton.style.color = '#1a73e8';
    searchButton.style.backgroundColor = 'rgba(26,115,232,0.08)';

    searchButton.addEventListener('click', () => {
      useGoogleSearch = !useGoogleSearch;
      if (useGoogleSearch) {
        searchButton.style.color = '#1a73e8';
        searchButton.style.backgroundColor = 'rgba(26,115,232,0.08)';
      } else {
        searchButton.style.color = '';
        searchButton.style.backgroundColor = '';
      }
    });
  }
  function clearFileAttachment() {
    selectedFilePart = null;
    selectedFileName = '';
    if (fileInput) fileInput.value = '';
    if (attachButton) attachButton.style.color = '';
    if (filePreviewBadge) {
      filePreviewBadge.style.display = 'none';
      filePreviewBadge.innerHTML = '';
    }
    if (sendButton && messageInput) {
      sendButton.disabled = messageInput.value.trim() === '';
    }
  }

  // ==========================================
  // 5. PARSER: MARKDOWN & LATEX
  // ==========================================
  function parseMarkdown(text) {
    if (!text) return '';

    let cleaned = text.replace(/\$([^$]+)\$/g, (match, formula) => {
      let cleanMath = formula
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        .replace(/\\/g, '')
        .trim();
      return `<strong style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace;">${cleanMath}</strong>`;
    });

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

  // ==========================================
  // 6. BACKEND API PROXY
  // ==========================================
  async function getGeminiResponse(query, filePart = null) {
    const parts = [];

    if (filePart) parts.push(filePart);
    if (query) parts.push({ text: query });

    // Build payload dynamically
    const requestPayload = {
      contents: [{ parts: parts }]
    };

    // Only include Google Search tool if the toggle is turned ON
    if (useGoogleSearch) {
      requestPayload.tools = [{ googleSearch: {} }];
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (data.error) {
        return { text: `API Error: ${data.error.message || data.error}`, sources: [] };
      }

      if (data.candidates && data.candidates[0].content) {
        const candidate = data.candidates[0];
        let textOutput = candidate.content.parts.map(part => part.text || '').join('\n');

        let sources = [];
        const metadata = candidate.groundingMetadata;
        if (metadata) {
          // Check standard grounding chunks
          if (metadata.groundingChunks) {
            sources = metadata.groundingChunks
              .filter(chunk => chunk.web && (chunk.web.uri || chunk.web.url))
              .map(chunk => ({
                title: chunk.web.title || chunk.web.uri || chunk.web.url,
                url: chunk.web.uri || chunk.web.url
              }));
          }
          // Fallback check for search entry point / web search queries if chunks are formatted differently
          else if (metadata.webSearchQueries && metadata.webSearchQueries.length > 0 && metadata.searchEntryPoint) {
            // If search was executed, display a generic search indicator or snippet if available
            sources = [{ title: `Searched: "${metadata.webSearchQueries[0]}"`, url: "#" }];
          }
        }

      return { text: "Received an unexpected response format from server.", sources: [] };
    } catch (error) {
      return { text: "Network error: Unable to connect to server.", sources: [] };
    }
  }

  // ==========================================
  // 7. CHAT & MESSAGE DELIVERY
  // ==========================================
  async function sendMessage() {
    if (!messageInput) return;

    const text = messageInput.value.trim();
    if (!text && !selectedFilePart) return;

    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const currentFilePart = selectedFilePart;
    const currentFileName = selectedFileName;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    clearFileAttachment();

    if (messagesContainer) {
      // User Message
      const userMsgDiv = document.createElement('div');
      userMsgDiv.className = 'user-message-wrapper';
      userMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;';
      
      let userAttachmentHTML = '';
      if (currentFilePart) {
        userAttachmentHTML = `
          <div style="font-size: 0.8rem; font-weight: 600; opacity: 0.8; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
            <span class="material-symbols-outlined" style="font-size: 14px;">attach_file</span> ${currentFileName}
          </div>
        `;
      }

      userMsgDiv.innerHTML = `
        <div style="background-color: var(--hover-bg, #f1f3f4); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word;">
          ${userAttachmentHTML}
          ${parseMarkdown(text)}
        </div>
      `;
      messagesContainer.appendChild(userMsgDiv);

      // Loading Indicator
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

      // API Call
      const responseData = await getGeminiResponse(text, currentFilePart);

      // Format Sources
      let sourcesHTML = '';
      if (responseData.sources && responseData.sources.length > 0) {
        const links = responseData.sources.slice(0, 5).map(s => 
          `<a href="${s.url}" target="_blank" rel="noopener" style="color: #1a73e8; text-decoration: none; background: rgba(26,115,232,0.08); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; display: inline-block;">${s.title}</a>`
        ).join(' ');

        sourcesHTML = `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-color, #eee); font-size: 0.85rem;">
            <strong style="display: block; margin-bottom: 4px; color: var(--text-muted, #666);">Sources:</strong>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${links}</div>
          </div>
        `;
      }

      const bubbleContent = aiMsgDiv.querySelector('#loadingBubble');
      if (bubbleContent) {
        bubbleContent.innerHTML = parseMarkdown(responseData.text) + sourcesHTML;
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // ==========================================
  // 8. INPUT LISTENERS
  // ==========================================
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      if (sendButton) {
        sendButton.disabled = messageInput.value.trim() === '' && !selectedFilePart;
      }
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  // New & Clear Chat
  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      if (messagesContainer) messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
      if (messageInput) {
        messageInput.value = '';
        messageInput.style.height = 'auto';
      }
      clearFileAttachment();
    });
  }

  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      if (messagesContainer) messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
      clearFileAttachment();
    });
  }

  // Suggestion Cards
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
