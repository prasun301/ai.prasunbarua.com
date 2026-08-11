document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 app.js initialized');

  let selectedFilePart = null;
  let selectedFileName = '';

  const getEl = (id) => document.getElementById(id);

  const sidebar = getEl('sidebar');
  const sidebarOverlay = getEl('sidebarOverlay');
  const themeButton = getEl('themeButton');
  const messageInput = getEl('messageInput') || getEl('userInput') || getEl('promptInput');
  const sendButton = getEl('sendButton') || getEl('submitBtn');
  const attachButton = getEl('attachButton');
  const fileInput = getEl('fileInput');
  const messagesContainer = getEl('messages') || getEl('chatContainer');
  const welcomeScreen = getEl('welcomeScreen');
  const newChatButton = getEl('newChatButton');
  const clearChatButton = getEl('clearChatButton');

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

  // --- UI Input Lock Utility ---
  function setInputsEnabled(enabled) {
    if (sendButton) sendButton.disabled = !enabled;
    if (messageInput) messageInput.disabled = !enabled;
    if (enabled && messageInput) messageInput.focus();
  }

  // --- File Conversion Helper ---
  function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({ inlineData: { data: base64Data, mimeType: file.type } });
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
  }

  // --- Basic Markdown Formatter ---
  function parseMarkdown(text) {
    if (!text) return '';
    if (typeof marked !== 'undefined') {
      return marked.parse(text);
    }
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // --- Backend API Function ---
  async function getGeminiResponse(query, filePart = null) {
    const parts = [];
    if (filePart) parts.push(filePart);
    if (query) parts.push({ text: query });

    const requestPayload = { contents: [{ parts }] };

    try {
      const response = await fetch('/functions/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (response.status === 429) {
        return { text: '⚠️ Rate limit reached. Waiting for server cooldown...', isError: true };
      }

      if (data.error) {
        return { text: `API Error: ${data.error.message || data.error}`, isError: true };
      }

      if (data.candidates && data.candidates[0].content) {
        const textOutput = data.candidates[0].content.parts.map(p => p.text || '').join('\n');
        return { text: textOutput, isError: false };
      }

      return { text: 'Unexpected server response format.', isError: true };
    } catch (error) {
      return { text: 'Network error: Unable to connect to server.', isError: true };
    }
  }

  // --- Send Message Action ---
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
    setInputsEnabled(false);

    if (messagesContainer) {
      // User Message Bubble
      const userMsgDiv = document.createElement('div');
      userMsgDiv.className = 'user-message-wrapper';
      userMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;';
      
      let userAttachmentHTML = '';
      if (currentFilePart) {
        userAttachmentHTML = `<div style="font-size: 0.8rem; font-weight: 600; opacity: 0.8; margin-bottom: 6px;"><span class="material-symbols-outlined" style="font-size: 14px;">attach_file</span> ${currentFileName}</div>`;
      }

      userMsgDiv.innerHTML = `
        <div style="background-color: var(--hover-bg, #f1f3f4); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word;">
          ${userAttachmentHTML}
          ${parseMarkdown(text)}
        </div>
      `;
      messagesContainer.appendChild(userMsgDiv);

      // AI Response Wrapper
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = 'ai-message-wrapper';
      aiMsgDiv.style.cssText = 'margin-bottom: 24px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
      aiMsgDiv.innerHTML = `
        <div style="width: 32px; height: 32px; background-color: #1a73e8; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span>
        </div>
        <div class="ai-bubble" style="background-color: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e0e0e0); padding: 14px 18px; border-radius: 16px; max-width: 85%; line-height: 1.6;">
          Thinking...
        </div>
      `;
      messagesContainer.appendChild(aiMsgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Fetch Response
      const responseData = await getGeminiResponse(text, currentFilePart);

      const bubbleContent = aiMsgDiv.querySelector('.ai-bubble');
      if (bubbleContent) {
        bubbleContent.innerHTML = parseMarkdown(responseData.text);
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      setInputsEnabled(true);
    }
  }

  // --- Listeners ---
  if (messageInput) {
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

  if (newChatButton) {
    newChatButton.addEventListener('click', () => {
      if (messagesContainer) messagesContainer.innerHTML = '';
      if (welcomeScreen) welcomeScreen.style.display = 'flex';
      clearFileAttachment();
    });
  }
});
