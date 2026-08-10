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

  // Chat Functionality (Send, Enter key, New Chat, Welcome screen toggle)
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messagesContainer = document.getElementById('messages');
  const welcomeScreen = document.getElementById('welcomeScreen');
  const newChatButton = document.getElementById('newChatButton');
  const clearChatButton = document.getElementById('clearChatButton');

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Hide welcome screen if visible
    if (welcomeScreen) {
      welcomeScreen.style.display = 'none';
    }

    // Append user message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-end; width: 100%;';
    userMsgDiv.innerHTML = `
      <div style="background-color: var(--hover-bg); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word; font-size: 0.95rem; color: var(--text-primary);">
        ${escapeHTML(text)}
      </div>
    `;
    messagesContainer.appendChild(userMsgDiv);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
      aiMsgDiv.innerHTML = `
        <div style="font-weight: bold; color: var(--accent-color); padding-top: 2px;">
          <span class="material-symbols-outlined" style="font-size: 20px;">sparkles</span>
        </div>
        <div style="background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: 16px; max-width: 75%; word-break: break-word; font-size: 0.95rem; color: var(--text-primary);">
          This is a simulated response from Prasun AI to: "${escapeHTML(text)}"
        </div>
      `;
      messagesContainer.appendChild(aiMsgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 600);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  if (messageInput && sendButton) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      sendButton.disabled = messageInput.value.trim() === '';
    });

    // Send message on pressing Enter (without Shift)
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

  // History Actions Logic (Rename and Delete Handlers)
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
