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

  function getSmartAIResponse(query) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('solar') || lowerQuery.includes('electricity')) {
      return `Solar panels generate electricity using **photovoltaic (PV) cells** made of silicon. Here is how it works step-by-step:
1. **Sunlight Absorption:** Sunlight hits the solar panels, and the PV cells absorb energy from the photons.
2. **Electron Movement:** This energy knocks electrons loose from their atoms, creating a flow of electrical current.
3. **Direct Current (DC):** The movement creates direct current (DC) electricity.
4. **Inverter Conversion:** An inverter converts this DC electricity into alternating current (AC), which is what homes and appliances use.`;
    } 
    else if (lowerQuery.includes('website') || lowerQuery.includes('portfolio')) {
      return `A professional website structure typically relies on a clean, modular setup:
* **Header / Navigation:** Clear branding and quick links to core sections.
* **Hero Section:** A strong value proposition or introduction with a primary call-to-action (CTA).
* **About Section:** Brief background, skills, or mission statement.
* **Projects / Services Grid:** Showcase of your best work or offerings using clean cards.
* **Footer:** Contact links, social profiles, and copyright info.`;
    } 
    else if (lowerQuery.includes('javascript') || lowerQuery.includes('learn')) {
      return `Here is a quick beginner roadmap to learn JavaScript:
1. **Basics:** Learn variables (\`let\`, \`const\`), data types, and basic operators.
2. **Control Flow:** Understand \`if/else\` statements and loops.
3. **Functions:** Learn how to write reusable blocks of code.
4. **DOM Manipulation:** Practice selecting HTML elements with \`document.querySelector()\` and changing their content dynamically.`;
    } 
    else if (lowerQuery.includes('space') || lowerQuery.includes('fact')) {
      return `Here are 5 fascinating space facts:
1. **A year on Venus is shorter than its day:** It takes Venus longer to rotate once on its axis than to complete one orbit around the Sun.
2. **Neutron stars are dense:** A single teaspoon of neutron star material weighs about 6 billion tons on Earth.
3. **Diamond planet:** 55 Cancri e is believed to have a core rich in carbon, much of which is diamond.
4. **Moon footprints:** Footprints on the Moon will stay there for millions of years due to no wind or water erosion.
5. **Silence in space:** Space is a vacuum, meaning sound waves have no medium to travel through.`;
    } 
    else {
      return `That's an interesting question regarding "${query}". As Prasun AI, I'm here to help you analyze code, write content, brainstorm ideas, or solve problems. Let me know what specific details you'd like to dive into!`;
    }
  }

  // Modern Markdown Parser to convert **text** and lists cleanly into HTML
  function parseMarkdown(text) {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert **bold** to <strong>
    let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split into lines for formatting paragraphs and lists
    let lines = formatted.split('\n');
    let htmlResult = [];

    lines.forEach(line => {
      let trimmed = line.trim();
      if (/^\d+\.\s/.test(trimmed)) {
        htmlResult.push(`<div style="margin: 4px 0 4px 12px;">• ${trimmed.replace(/^\d+\.\s*/, '')}</div>`);
      } else if (/^[\*\-]\s/.test(trimmed)) {
        htmlResult.push(`<div style="margin: 4px 0 4px 12px;">• ${trimmed.replace(/^[\*\-]\s*/, '')}</div>`);
      } else if (trimmed.length > 0) {
        htmlResult.push(`<p style="margin-bottom: 6px;">${trimmed}</p>`);
      }
    });

    return htmlResult.join('');
  }

  function sendMessage() {
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

    // Simulate AI Response with Clean Modern UI
    setTimeout(() => {
      const rawAiResponse = getSmartAIResponse(text);
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.style.cssText = 'margin-bottom: 24px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
      aiMsgDiv.innerHTML = `
        <div style="width: 32px; height: 32px; background-color: var(--accent-color); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span class="material-symbols-outlined" style="font-size: 18px;">sparkles</span>
        </div>
        <div style="background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 14px 18px; border-radius: 16px; max-width: 80%; word-break: break-word; font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">
          ${parseMarkdown(rawAiResponse)}
        </div>
      `;
      messagesContainer.appendChild(aiMsgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 600);
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
