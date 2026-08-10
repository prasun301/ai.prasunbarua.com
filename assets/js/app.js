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
      * **Footer:** Contact links, social profiles, and copyright info.
      * *Tech Stack Recommendation:* HTML5, CSS3 (with Flexbox/Grid), and vanilla JavaScript for interactivity.`;
    } 
    else if (lowerQuery.includes('javascript') || lowerQuery.includes('learn')) {
      return `Here is a quick beginner roadmap to learn JavaScript:
      1. **Basics:** Learn variables (\`let\`, \`const\`), data types (strings, numbers, booleans), and basic operators.
      2. **Control Flow:** Understand \`if/else\` statements and loops (\`for\`, \`while\`).
      3. **Functions:** Learn how to write reusable blocks of code and arrow functions.
      4. **DOM Manipulation:** Practice selecting HTML elements with \`document.querySelector()\` and changing their content or styles dynamically.
      5. **Projects:** Build small tools like a calculator, todo list, or weather app!`;
    } 
    else if (lowerQuery.includes('space') || lowerQuery.includes('fact')) {
      return `Here are 5 fascinating space facts:
      1. **A year on Venus is shorter than its day:** It takes Venus longer to rotate once on its axis than to complete one orbit around the Sun.
      2. **Neutron stars are mind-bogglingly dense:** A single teaspoon of neutron star material would weigh about 6 billion tons on Earth.
      3. **There is a planet made of diamond:** 55 Cancri e is believed to have a core rich in carbon, much of which is diamond.
      4. **Footprints on the Moon will stay there for millions of years:** There is no wind or water erosion on the Moon to wipe them away.
      5. **Space is completely silent:** Sound waves need a medium (like air) to travel through, and space is a vacuum.`;
    } 
    else {
      return `That's an interesting question regarding "${query}". As Prasun AI, I'm here to help you analyze code, write content, brainstorm ideas, or solve problems. Let me know what specific details or code snippets you'd like to dive into!`;
    }
  }

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

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

    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate smart AI response after a short delay
    setTimeout(() => {
      const aiResponseText = getSmartAIResponse(text);
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.style.cssText = 'margin-bottom: 16px; display: flex; justify-content: flex-start; gap: 12px; width: 100%;';
      aiMsgDiv.innerHTML = `
        <div style="font-weight: bold; color: var(--accent-color); padding-top: 2px;">
          <span class="material-symbols-outlined" style="font-size: 20px;">sparkles</span>
        </div>
        <div style="background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: 16px; max-width: 80%; word-break: break-word; font-size: 0.95rem; color: var(--text-primary); line-height: 1.5;">
          ${aiResponseText.replace(/\n/g, '<br>')}
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
