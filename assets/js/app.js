document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  let selectedFilePart = null; // Stores { inlineData: { mimeType, data } }
  let selectedFileName = '';   // Stores attached file name for UI preview

  // ==========================================
  // 2. DOM ELEMENTS
  // ==========================================
  const sidebar = document.getElementById('sidebar');
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  const themeButton = document.getElementById('themeButton');
  const settingsBtn = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModal = document.getElementById('closeSettingsModal');

  const modelSelectorBtn = document.getElementById('modelSelector');
  const modelDropdown = document.getElementById('modelDropdown');

  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const attachButton = document.getElementById('attachButton');
  const fileInput = document.getElementById('fileInput');
  const messagesContainer = document.getElementById('messages');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const newChatButton = document.getElementById('newChatButton');
  const clearChatButton = document.getElementById('clearChatButton');

  // ==========================================
  // 3. UI CONTROLLERS & EVENT LISTENERS
  // ==========================================

  // --- Sidebar Drawer ---
  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
  }

  if (openSidebarBtn) openSidebarBtn.addEventListener('click', toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // --- Dark / Light Theme Toggle ---
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
    settingsBtn.addEventListener('click', () => settingsModal.showModal());
  }

  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => settingsModal.close());
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      const rect = settingsModal.getBoundingClientRect();
      if (
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom
      ) {
        settingsModal.close();
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
  // 4. FILE ATTACHMENT HANDLERS
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

  function clearFileAttachment() {
    selectedFilePart = null;
    selectedFileName = '';
    if (fileInput) fileInput.value = '';
    if (attachButton) attachButton.style.color = '';
    if (filePreviewBadge) {
      filePreviewBadge.style.display = 'none';
      filePreviewBadge.innerHTML = '';
    }
    if (sendButton) sendButton.disabled = messageInput.value.trim() === '';
  }

  // ==========================================
  // 5. PARSER: MARKDOWN & LATEX MATH
  // ==========================================
  function parseMarkdown(text) {
    if (!text) return '';

    // Clean up LaTeX math formulas (e.g., $30\frac{3}{4}$ -> 30 3/4)
    let cleaned = text.replace(/\$([^$]+)\$/g, (match, formula) => {
      let cleanMath = formula
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        .replace(/\\/g, '')
        .trim();
      return `<strong style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: monospace;">${cleanMath}</strong>`;
    });

    // Use Marked.js if present
    if (typeof marked !== 'undefined') {
      return marked.parse(cleaned);
    }

    // Fallback Regex Parser
    return cleaned
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // ==========================================
  // 6. CLOUDFLARE BACKEND PROXY CALL
  // ==========================================
  async function getGeminiResponse(query, filePart = null) {
    const parts = [];

    if (filePart) {
      parts.push(filePart);
    }
    if (query) {
      parts.push({ text: query });
    }

    try {
      // Calls Cloudflare Pages Function at /api/chat securely without exposing API key
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          tools: [{ googleSearch: {} }]
        })
      });

      const data = await response.json();

      if (data.error) {
        return { text: `API Error: ${data.error.message || data.error}`, sources: [] };
      }

      if (data.candidates && data.candidates[0].content) {
        const candidate = data.candidates[0];
        
        let textOutput = candidate.content.parts
          .map(part => part.text || '')
          .join('\n');

        let sources = [];
        const metadata = candidate.groundingMetadata;
        if (metadata && metadata.groundingChunks) {
          sources = metadata.groundingChunks
            .filter(chunk => chunk.web && chunk.web.uri)
            .map(chunk => ({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri
            }));
        }

        return { text: textOutput, sources: sources };
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
    const text = messageInput.value.trim();
    if (!text && !selectedFilePart) return;

    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const currentFilePart = selectedFilePart;
    const currentFileName = selectedFileName;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    clearFileAttachment();

    // Render User Message
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
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Render Thinking Bubble
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

    // Call Cloudflare Proxy Function
    const responseData = await getGeminiResponse(text, currentFilePart);

    // Format Sources HTML
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

    // Update Bubble Content
    const bubbleContent = aiMsgDiv.querySelector('#loadingBubble');
    bubbleContent.innerHTML = parseMarkdown(responseData.text) + sourcesHTML;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ==========================================
  // 8. INPUT LISTENERS & BUTTON HANDLERS
  // ==========================================
  if (messageInput && sendButton) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      sendButton.disabled = messageInput.value.trim() === '' && !selectedFilePart;
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) sendMessage();
      }
    });

    sendButton.addEventListener('click', sendMessage);
  }

  // New Chat
  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
      if (messageInput) {
        messageInput.value = '';
        messageInput.style.height = 'auto';
      }
      clearFileAttachment();
    });
  }

  // Clear Chat
  if (clearChatButton) {
    clearChatButton.addEventListener('click', () => {
      messagesContainer.innerHTML = '';
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

  // History Item Rename/Delete
  document.querySelectorAll('.history-item').forEach(item => {
    const editBtn = item.querySelector('[title="Rename"]');
    const deleteBtn = item.querySelector('[title="Delete"]');

    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const titleSpan = item.querySelector('.history-item-left span:last-child');
        if (titleSpan) {
          const newTitle = prompt('Rename chat:', titleSpan.textContent);
          if (newTitle) titleSpan.textContent = newTitle;
        }
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
