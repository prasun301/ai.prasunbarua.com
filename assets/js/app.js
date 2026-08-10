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

  // Close modal when clicking outside of it
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

  // Textarea Auto-resize & Send Button State
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  if (messageInput && sendButton) {
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
      sendButton.disabled = messageInput.value.trim() === '';
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
