/**
 * ============================================================
 * PRASUN AI — Main Application Logic
 * ============================================================
 *
 * Frontend:
 *   index.html
 *       ↓
 *   app.js
 *       ↓
 *   POST /api/chat
 *       ↓
 *   Cloudflare Pages Function
 *       ↓
 *   Cloudflare AI
 *       ↓
 *   Google Gemini
 *
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================================================
  // DOM ELEMENTS
  // ==========================================================

  const elements = {
    app: document.querySelector(".app"),

    sidebar: document.getElementById("sidebar"),
    openSidebar: document.getElementById("openSidebar"),
    closeSidebar: document.getElementById("closeSidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),

    newChatButton: document.getElementById("newChatButton"),
    chatSearch: document.getElementById("chatSearch"),
    historyContainer: document.getElementById("historyContainer"),

    modelSelector: document.getElementById("modelSelector"),
    modelDropdown: document.getElementById("modelDropdown"),
    modelName: document.querySelector(".model-name"),

    clearChatButton: document.getElementById("clearChatButton"),
    shareButton: document.getElementById("shareButton"),

    themeButton: document.getElementById("themeButton"),
    themeColorMeta: document.getElementById("themeColor"),
    settingsButton: document.getElementById("settingsButton"),

    chatArea: document.getElementById("chatArea"),
    welcomeScreen: document.getElementById("welcomeScreen"),
    messages: document.getElementById("messages"),
    suggestionCards: document.querySelectorAll(".suggestion-card"),

    messageInput: document.getElementById("messageInput"),

    attachButton: document.getElementById("attachButton"),
    fileInput: document.getElementById("fileInput"),

    attachmentPreview: document.getElementById("attachmentPreview"),
    attachmentName: document.getElementById("attachmentName"),
    attachmentSize: document.getElementById("attachmentSize"),
    removeAttachment: document.getElementById("removeAttachment"),

    voiceButton: document.getElementById("voiceButton"),
    toolsButton: document.getElementById("toolsButton"),

    sendButton: document.getElementById("sendButton"),
    stopButton: document.getElementById("stopButton"),

    settingsModal: document.getElementById("settingsModal"),
    closeSettingsModal: document.getElementById("closeSettingsModal"),
    apiKeyInput: document.getElementById("apiKeyInput")
  };

  // ==========================================================
  // APPLICATION STATE
  // ==========================================================

  const state = {
    theme: localStorage.getItem("prasun_theme") || "light",

    // UI model key only.
    // Backend currently uses the configured Gemini model.
    activeModel: "prasun-4",

    attachedFile: null,

    isGenerating: false,

    abortController: null,

    toolsEnabled: false,

    isListening: false,

    recognition: null,

    // Current conversation
    conversation: [],

    // Current conversation ID
    conversationId: null,

    // Prevent accidental duplicate sends
    requestId: 0
  };

  // ==========================================================
  // STORAGE KEYS
  // ==========================================================

  const STORAGE = {
    conversations: "prasun_ai_conversations",
    activeConversation: "prasun_ai_active_conversation"
  };

  // ==========================================================
  // INITIALIZATION
  // ==========================================================

  function init() {
    applyTheme(state.theme);

    loadOrCreateConversation();

    setupEventListeners();

    setupSpeechRecognition();

    renderConversation();

    updateSendButtonState();

    handleInputResize();
  }

  // ==========================================================
  // THEME
  // ==========================================================

  function applyTheme(theme) {
    state.theme = theme;

    localStorage.setItem("prasun_theme", theme);

    if (theme === "dark") {
      document.body.classList.add("dark-theme");

      if (elements.themeColorMeta) {
        elements.themeColorMeta.content = "#171717";
      }
    } else {
      document.body.classList.remove("dark-theme");

      if (elements.themeColorMeta) {
        elements.themeColorMeta.content = "#ffffff";
      }
    }
  }

  function toggleTheme() {
    applyTheme(
      state.theme === "light"
        ? "dark"
        : "light"
    );
  }

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  function toggleSidebar(show) {
    if (!elements.sidebar) return;

    const isOpen =
      show !== undefined
        ? show
        : !elements.sidebar.classList.contains("active");

    elements.sidebar.classList.toggle(
      "active",
      isOpen
    );

    if (elements.sidebarOverlay) {
      elements.sidebarOverlay.classList.toggle(
        "active",
        isOpen
      );
    }
  }

  // ==========================================================
  // INPUT
  // ==========================================================

  function handleInputResize() {
    if (!elements.messageInput) return;

    elements.messageInput.style.height = "auto";

    const newHeight = Math.min(
      elements.messageInput.scrollHeight,
      180
    );

    elements.messageInput.style.height =
      `${newHeight}px`;

    updateSendButtonState();
  }

  function updateSendButtonState() {
    if (!elements.sendButton) return;

    const hasText =
      elements.messageInput &&
      elements.messageInput.value.trim().length > 0;

    const hasFile =
      state.attachedFile !== null;

    elements.sendButton.disabled =
      !(hasText || hasFile) ||
      state.isGenerating;
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        elements.sendButton &&
        !elements.sendButton.disabled
      ) {
        sendMessage();
      }
    }
  }

  // ==========================================================
  // FILE ATTACHMENT
  // ==========================================================

  function handleFileSelect(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    state.attachedFile = file;

    if (elements.attachmentName) {
      elements.attachmentName.textContent =
        file.name;
    }

    if (elements.attachmentSize) {
      elements.attachmentSize.textContent =
        formatFileSize(file.size);
    }

    if (elements.attachmentPreview) {
      elements.attachmentPreview.hidden = false;
    }

    updateSendButtonState();
  }

  function removeAttachment() {
    state.attachedFile = null;

    if (elements.fileInput) {
      elements.fileInput.value = "";
    }

    if (elements.attachmentPreview) {
      elements.attachmentPreview.hidden = true;
    }

    updateSendButtonState();
  }

  function formatFileSize(bytes) {
    if (!bytes) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB"
    ];

    const index = Math.min(
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      ),
      units.length - 1
    );

    const value =
      bytes /
      Math.pow(1024, index);

    return (
      `${parseFloat(value.toFixed(1))} ` +
      `${units[index]}`
    );
  }

  // ==========================================================
  // VOICE INPUT
  // ==========================================================

  function setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (elements.voiceButton) {
        elements.voiceButton.style.display =
          "none";
      }

      return;
    }

    state.recognition =
      new SpeechRecognition();

    state.recognition.continuous = false;

    state.recognition.interimResults = true;

    state.recognition.onstart = () => {
      state.isListening = true;

      elements.voiceButton?.classList.add(
        "listening"
      );
    };

    state.recognition.onresult =
      (event) => {
        const transcript =
          Array.from(event.results)
            .map(
              result =>
                result[0].transcript
            )
            .join("");

        if (elements.messageInput) {
          elements.messageInput.value =
            transcript;
        }

        handleInputResize();
      };

    state.recognition.onerror = () => {
      stopListening();
    };

    state.recognition.onend = () => {
      stopListening();
    };
  }

  function toggleVoiceInput() {
    if (!state.recognition) {
      return;
    }

    if (state.isListening) {
      state.recognition.stop();
    } else {
      try {
        state.recognition.start();
      } catch {
        // Browser may reject repeated start calls.
      }
    }
  }

  function stopListening() {
    state.isListening = false;

    elements.voiceButton?.classList.remove(
      "listening"
    );
  }

  // ==========================================================
  // CONVERSATION STORAGE
  // ==========================================================

  function generateConversationId() {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  function createConversation() {
    return {
      id: generateConversationId(),

      title: "New chat",

      createdAt: Date.now(),

      updatedAt: Date.now(),

      messages: []
    };
  }

  function getStoredConversations() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE.conversations
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  function saveStoredConversations(
    conversations
  ) {
    try {
      localStorage.setItem(
        STORAGE.conversations,
        JSON.stringify(conversations)
      );
    } catch (error) {
      console.warn(
        "Could not save conversations:",
        error
      );
    }
  }

  function saveCurrentConversation() {
    if (!state.conversationId) {
      return;
    }

    const conversations =
      getStoredConversations();

    const index =
      conversations.findIndex(
        conversation =>
          conversation.id ===
          state.conversationId
      );

    const currentConversation = {
      id: state.conversationId,

      title:
        getConversationTitle(),

      createdAt:
        state.conversation.createdAt ||
        Date.now(),

      updatedAt: Date.now(),

      messages:
        state.conversation.messages || []
    };

    if (index >= 0) {
      conversations[index] =
        currentConversation;
    } else {
      conversations.unshift(
        currentConversation
      );
    }

    saveStoredConversations(
      conversations
    );

    localStorage.setItem(
      STORAGE.activeConversation,
      state.conversationId
    );

    renderHistory();
  }

  function getConversationTitle() {
    const firstUserMessage =
      state.conversation.messages.find(
        message =>
          message.role === "user"
      );

    if (
      !firstUserMessage ||
      !firstUserMessage.content
    ) {
      return "New chat";
    }

    const title =
      firstUserMessage.content
        .replace(/\s+/g, " ")
        .trim();

    return title.length > 42
      ? title.slice(0, 42) + "…"
      : title;
  }

  function loadOrCreateConversation() {
    const conversations =
      getStoredConversations();

    const activeId =
      localStorage.getItem(
        STORAGE.activeConversation
      );

    let activeConversation =
      conversations.find(
        conversation =>
          conversation.id ===
          activeId
      );

    if (!activeConversation) {
      activeConversation =
        createConversation();

      conversations.unshift(
        activeConversation
      );

      saveStoredConversations(
        conversations
      );
    }

    state.conversationId =
      activeConversation.id;

    state.conversation = {
      id: activeConversation.id,

      title: activeConversation.title,

      createdAt:
        activeConversation.createdAt,

      updatedAt:
        activeConversation.updatedAt,

      messages:
        Array.isArray(
          activeConversation.messages
        )
          ? activeConversation.messages
          : []
    };

    localStorage.setItem(
      STORAGE.activeConversation,
      state.conversationId
    );
  }

  // ==========================================================
  // RENDER CURRENT CONVERSATION
  // ==========================================================

  function renderConversation() {
    if (!elements.messages) {
      return;
    }

    elements.messages.innerHTML = "";

    const messages =
      state.conversation.messages || [];

    if (!messages.length) {
      showWelcomeScreen();
      return;
    }

    hideWelcomeScreen();

    messages.forEach(message => {
      appendMessage(
        message.role,
        message.content
      );
    });

    scrollToBottom();
  }

  function showWelcomeScreen() {
    if (elements.welcomeScreen) {
      elements.welcomeScreen.style.display =
        "flex";
    }
  }

  function hideWelcomeScreen() {
    if (elements.welcomeScreen) {
      elements.welcomeScreen.style.display =
        "none";
    }
  }

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  async function sendMessage(
    customPrompt = null
  ) {
    if (state.isGenerating) {
      return;
    }

    const text =
      customPrompt !== null
        ? String(customPrompt).trim()
        : elements.messageInput?.value
            .trim() || "";

    const attachedFile =
      state.attachedFile;

    if (!text && !attachedFile) {
      return;
    }

    hideWelcomeScreen();

    // --------------------------------------------------------
    // Add user message
    // --------------------------------------------------------

    let displayText = text;

    if (attachedFile) {
      displayText =
        text ||
        `Attached file: ${attachedFile.name}`;
    }

    state.conversation.messages.push({
      role: "user",
      content: displayText
    });

    state.conversation.updatedAt =
      Date.now();

    appendMessage(
      "user",
      displayText,
      attachedFile
    );

    saveCurrentConversation();

    // --------------------------------------------------------
    // Reset input
    // --------------------------------------------------------

    if (elements.messageInput) {
      elements.messageInput.value = "";
    }

    handleInputResize();

    if (attachedFile) {
      removeAttachment();
    }

    // --------------------------------------------------------
    // Generate real AI response
    // --------------------------------------------------------

    await generateAiResponse();
  }

  // ==========================================================
  // REAL AI REQUEST
  // ==========================================================

  async function generateAiResponse() {
    if (state.isGenerating) {
      return;
    }

    state.isGenerating = true;

    state.requestId += 1;

    const currentRequestId =
      state.requestId;

    state.abortController =
      new AbortController();

    setGenerationUI(true);

    // Create temporary assistant message
    const aiMessageEl =
      createAssistantMessageElement(
        "Thinking…"
      );

    try {
      // ------------------------------------------------------
      // Send only a reasonable amount of history
      // Backend also applies its own limit.
      // ------------------------------------------------------

      const history =
        state.conversation.messages
          .slice(-20)
          .map(message => ({
            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content:
              String(
                message.content || ""
              )
          }));

      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              messages: history,

              model:
                state.activeModel
            }),

            signal:
              state.abortController
                .signal
          }
        );

      // ------------------------------------------------------
      // Parse JSON
      // ------------------------------------------------------

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      // ------------------------------------------------------
      // HTTP error
      // ------------------------------------------------------

      if (!response.ok) {
  console.error(
    "PRASUN AI SERVER RESPONSE:",
    data
  );

  const serverError =
    data?.error ||
    data?.message ||
    data?.response ||
    `Server returned HTTP ${response.status}`;

  throw new Error(
    `${serverError} [HTTP ${response.status}]`
  );
}

      // ------------------------------------------------------
      // Extract response
      // ------------------------------------------------------

      const answer =
        typeof data?.response ===
        "string"
          ? data.response.trim()
          : "";

      if (!answer) {
        throw new Error(
          "The AI returned an empty response."
        );
      }

      // ------------------------------------------------------
      // Ignore stale request
      // ------------------------------------------------------

      if (
        currentRequestId !==
        state.requestId
      ) {
        return;
      }

      // ------------------------------------------------------
      // Replace temporary message
      // ------------------------------------------------------

      updateAssistantMessage(
        aiMessageEl,
        answer
      );

      // ------------------------------------------------------
      // Save assistant response
      // ------------------------------------------------------

      state.conversation.messages.push({
        role: "assistant",
        content: answer
      });

      state.conversation.updatedAt =
        Date.now();

      saveCurrentConversation();

} catch (error) {
  if (error?.name === "AbortError") {
    updateAssistantMessage(
      aiMessageEl,
      "Generation stopped."
    );

    return;
  }

  console.error(
    "PRASUN AI ERROR:",
    error
  );

  let errorMessage =
    error?.message ||
    "Unknown error";

  updateAssistantMessage(
    aiMessageEl,
    `### Prasun AI Error

**${errorMessage}**

Please check the browser console for the technical details.`
  );
}

    } finally {
      if (
        currentRequestId ===
        state.requestId
      ) {
        state.isGenerating = false;

        state.abortController =
          null;

        setGenerationUI(false);
      }

      scrollToBottom();
    }
  }

  // ==========================================================
  // STOP GENERATION
  // ==========================================================

  function stopGeneration() {
    if (
      state.abortController &&
      state.isGenerating
    ) {
      state.abortController.abort();
    }
  }

  // ==========================================================
  // GENERATION UI
  // ==========================================================

  function setGenerationUI(
    generating
  ) {
    if (elements.sendButton) {
      elements.sendButton.hidden =
        generating;
    }

    if (elements.stopButton) {
      elements.stopButton.hidden =
        !generating;
    }

    updateSendButtonState();
  }

  // ==========================================================
  // MESSAGE ELEMENT
  // ==========================================================

  function createAssistantMessageElement(
    text
  ) {
    const messageEl =
      document.createElement("div");

    messageEl.className =
      "message message-assistant";

    const avatar =
      document.createElement("div");

    avatar.className =
      "message-avatar";

    avatar.textContent = "✦";

    const content =
      document.createElement("div");

    content.className =
      "message-content";

    const textContainer =
      document.createElement("div");

    textContainer.className =
      "message-text";

    textContainer.innerHTML =
      formatMessageText(text);

    content.appendChild(
      textContainer
    );

    messageEl.appendChild(avatar);

    messageEl.appendChild(content);

    elements.messages.appendChild(
      messageEl
    );

    scrollToBottom();

    return messageEl;
  }

  function updateAssistantMessage(
    messageEl,
    text
  ) {
    if (!messageEl) return;

    const textContainer =
      messageEl.querySelector(
        ".message-text"
      );

    if (!textContainer) return;

    textContainer.innerHTML =
      formatMessageText(text);

    scrollToBottom();
  }

  // ==========================================================
  // APPEND MESSAGE
  // ==========================================================

  function appendMessage(
    role,
    text,
    file = null
  ) {
    const messageEl =
      document.createElement("div");

    messageEl.className =
      `message message-${role}`;

    // Avatar
    const avatar =
      document.createElement("div");

    avatar.className =
      "message-avatar";

    avatar.textContent =
      role === "user"
        ? "P"
        : "✦";

    // Content wrapper
    const content =
      document.createElement("div");

    content.className =
      "message-content";

    // File
    if (file) {
      const fileWrapper =
        document.createElement(
          "div"
        );

      fileWrapper.className =
        "message-attachment";

      const chip =
        document.createElement(
          "span"
        );

      chip.className =
        "attachment-chip";

      chip.textContent =
        `📎 ${file.name}`;

      fileWrapper.appendChild(
        chip
      );

      content.appendChild(
        fileWrapper
      );
    }

    // Text
    const textContainer =
      document.createElement("div");

    textContainer.className =
      "message-text";

    textContainer.innerHTML =
      formatMessageText(
        text || ""
      );

    content.appendChild(
      textContainer
    );

    messageEl.appendChild(
      avatar
    );

    messageEl.appendChild(
      content
    );

    elements.messages.appendChild(
      messageEl
    );

    scrollToBottom();

    return messageEl;
  }

  // ==========================================================
  // SAFE MESSAGE FORMATTER
  // ==========================================================

  function formatMessageText(
    text
  ) {
    if (!text) {
      return "";
    }

    const escaped =
      escapeHtml(String(text));

    // --------------------------------------------------------
    // Code blocks
    // --------------------------------------------------------

    let formatted =
      escaped.replace(
        /```([\s\S]*?)```/g,
        (_, code) => {
          return (
            "<pre><code>" +
            code.trim() +
            "</code></pre>"
          );
        }
      );

    // --------------------------------------------------------
    // Inline code
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
      );

    // --------------------------------------------------------
    // Bold
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );

    // --------------------------------------------------------
    // Headings
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /^### (.*)$/gm,
        "<h4>$1</h4>"
      );

    formatted =
      formatted.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
      );

    formatted =
      formatted.replace(
        /^# (.*)$/gm,
        "<h2>$1</h2>"
      );

    // --------------------------------------------------------
    // Bullet lists
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /^[•*-] (.*)$/gm,
        "<li>$1</li>"
      );

    formatted =
      formatted.replace(
        /(<li>.*<\/li>)/gs,
        "<ul>$1</ul>"
      );

    // --------------------------------------------------------
    // Numbered lists
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /^\d+\.\s+(.*)$/gm,
        "<li>$1</li>"
      );

    // --------------------------------------------------------
    // New lines
    // --------------------------------------------------------

    formatted =
      formatted.replace(
        /\n/g,
        "<br>"
      );

    // Remove breaks directly around block elements
    formatted =
      formatted.replace(
        /<br>(<h[234]>)/g,
        "$1"
      );

    formatted =
      formatted.replace(
        /(<\/h[234]>)<br>/g,
        "$1"
      );

    formatted =
      formatted.replace(
        /<br>(<pre>)/g,
        "$1"
      );

    formatted =
      formatted.replace(
        /(<\/pre>)<br>/g,
        "$1"
      );

    return formatted;
  }

  function escapeHtml(
    value
  ) {
    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  // ==========================================================
  // SCROLL
  // ==========================================================

  function scrollToBottom() {
    if (!elements.chatArea) {
      return;
    }

    requestAnimationFrame(() => {
      elements.chatArea.scrollTop =
        elements.chatArea.scrollHeight;
    });
  }

  // ==========================================================
  // NEW CHAT
  // ==========================================================

  function startNewChat() {
    if (state.isGenerating) {
      stopGeneration();
    }

    const conversation =
      createConversation();

    state.conversationId =
      conversation.id;

    state.conversation =
      conversation;

    localStorage.setItem(
      STORAGE.activeConversation,
      conversation.id
    );

    renderConversation();

    if (elements.messageInput) {
      elements.messageInput.value = "";
    }

    removeAttachment();

    handleInputResize();

    if (
      window.innerWidth <= 768
    ) {
      toggleSidebar(false);
    }
  }

  // ==========================================================
  // CLEAR CURRENT CHAT
  // ==========================================================

  function clearChat() {
    if (state.isGenerating) {
      stopGeneration();
    }

    state.conversation.messages =
      [];

    state.conversation.updatedAt =
      Date.now();

    saveCurrentConversation();

    renderConversation();

    if (elements.messageInput) {
      elements.messageInput.value =
        "";
    }

    removeAttachment();

    handleInputResize();
  }

  // ==========================================================
  // MODEL SELECTOR
  // ==========================================================

  function setupModelSelector() {
    if (!elements.modelSelector) {
      return;
    }

    elements.modelSelector.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        if (!elements.modelDropdown) {
          return;
        }

        const isHidden =
          elements.modelDropdown.hidden;

        elements.modelDropdown.hidden =
          !isHidden;

        elements.modelSelector.setAttribute(
          "aria-expanded",
          String(isHidden)
        );
      }
    );

    document
      .querySelectorAll(
        ".model-option"
      )
      .forEach(option => {
        option.addEventListener(
          "click",
          event => {
            event.stopPropagation();

            const selectedModel =
              option.getAttribute(
                "data-model"
              );

            const nameElement =
              option.querySelector(
                "strong"
              );

            const selectedName =
              nameElement
                ? nameElement.textContent
                : "Prasun AI";

            if (selectedModel) {
              state.activeModel =
                selectedModel;
            }

            if (elements.modelName) {
              elements.modelName.textContent =
                selectedName;
            }

            document
              .querySelectorAll(
                ".model-option"
              )
              .forEach(
                modelOption =>
                  modelOption.classList.remove(
                    "active"
                  )
              );

            option.classList.add(
              "active"
            );

            if (
              elements.modelDropdown
            ) {
              elements.modelDropdown.hidden =
                true;
            }

            elements.modelSelector?.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      });

    document.addEventListener(
      "click",
      event => {
        if (
          elements.modelSelector &&
          !elements.modelSelector.contains(
            event.target
          )
        ) {
          if (
            elements.modelDropdown
          ) {
            elements.modelDropdown.hidden =
              true;
          }

          elements.modelSelector.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }

  // ==========================================================
  // CHAT HISTORY
  // ==========================================================

  function renderHistory() {
    if (!elements.historyContainer) {
      return;
    }

    const conversations =
      getStoredConversations();

    // Keep only conversations that contain messages
    const usable =
      conversations.filter(
        conversation =>
          Array.isArray(
            conversation.messages
          ) &&
          conversation.messages.length
      );

    elements.historyContainer.innerHTML =
      "";

    if (!usable.length) {
      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "history-empty";

      empty.textContent =
        "No conversations yet";

      elements.historyContainer.appendChild(
        empty
      );

      return;
    }

    const title =
      document.createElement(
        "div"
      );

    title.className =
      "history-section-title";

    title.textContent =
      "Recent";

    elements.historyContainer.appendChild(
      title
    );

    usable
      .sort(
        (a, b) =>
          (b.updatedAt || 0) -
          (a.updatedAt || 0)
      )
      .slice(0, 30)
      .forEach(
        conversation => {
          const item =
            document.createElement(
              "a"
            );

          item.href = "#";

          item.className =
            "history-item";

          if (
            conversation.id ===
            state.conversationId
          ) {
            item.classList.add(
              "active"
            );
          }

          const left =
            document.createElement(
              "div"
            );

          left.className =
            "history-item-left";

          const icon =
            document.createElement(
              "span"
            );

          icon.textContent = "💬";

          const text =
            document.createElement(
              "span"
            );

          text.textContent =
            conversation.title ||
            "New chat";

          text.style.overflow =
            "hidden";

          text.style.textOverflow =
            "ellipsis";

          text.style.whiteSpace =
            "nowrap";

          left.appendChild(icon);

          left.appendChild(text);

          item.appendChild(left);

          item.addEventListener(
            "click",
            event => {
              event.preventDefault();

              loadConversation(
                conversation.id
              );
            }
          );

          elements.historyContainer.appendChild(
            item
          );
        }
      );
  }

  function loadConversation(
    conversationId
  ) {
    const conversations =
      getStoredConversations();

    const conversation =
      conversations.find(
        item =>
          item.id ===
          conversationId
      );

    if (!conversation) {
      return;
    }

    if (state.isGenerating) {
      stopGeneration();
    }

    state.conversationId =
      conversation.id;

    state.conversation = {
      id: conversation.id,

      title:
        conversation.title ||
        "New chat",

      createdAt:
        conversation.createdAt ||
        Date.now(),

      updatedAt:
        conversation.updatedAt ||
        Date.now(),

      messages:
        Array.isArray(
          conversation.messages
        )
          ? conversation.messages
          : []
    };

    localStorage.setItem(
      STORAGE.activeConversation,
      state.conversationId
    );

    renderConversation();

    renderHistory();

    if (
      window.innerWidth <= 768
    ) {
      toggleSidebar(false);
    }
  }

  // ==========================================================
  // SEARCH HISTORY
  // ==========================================================

  function searchHistory(query) {
    const normalized =
      query.trim().toLowerCase();

    document
      .querySelectorAll(
        ".history-item"
      )
      .forEach(item => {
        const text =
          item.textContent
            .toLowerCase();

        item.style.display =
          !normalized ||
          text.includes(normalized)
            ? "flex"
            : "none";
      });
  }

  // ==========================================================
  // SHARE
  // ==========================================================

  async function shareChat() {
    const text =
      state.conversation.messages
        .map(message => {
          const role =
            message.role ===
            "assistant"
              ? "Prasun AI"
              : "You";

          return `${role}:\n${message.content}`;
        })
        .join("\n\n");

    if (!text) {
      return;
    }

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "Prasun AI Conversation",
          text
        });

        return;
      }

      await navigator.clipboard.writeText(
        text
      );

      alert(
        "Conversation copied to clipboard."
      );
    } catch (error) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.warn(
          "Share failed:",
          error
        );
      }
    }
  }

  // ==========================================================
  // WEB SEARCH BUTTON
  // ==========================================================

  function toggleTools() {
    state.toolsEnabled =
      !state.toolsEnabled;

    if (elements.toolsButton) {
      elements.toolsButton.classList.toggle(
        "active",
        state.toolsEnabled
      );
    }

    // Web search is not connected to a backend yet.
    // Do not falsely claim that it is active.
    if (state.toolsEnabled) {
      state.toolsEnabled = false;

      elements.toolsButton?.classList.remove(
        "active"
      );

      alert(
        "Web Search is not available yet. Prasun AI normal chat is ready."
      );
    }
  }

  // ==========================================================
  // EVENT LISTENERS
  // ==========================================================

  function setupEventListeners() {
    // Sidebar
    elements.openSidebar?.addEventListener(
      "click",
      () => toggleSidebar(true)
    );

    elements.closeSidebar?.addEventListener(
      "click",
      () => toggleSidebar(false)
    );

    elements.sidebarOverlay?.addEventListener(
      "click",
      () => toggleSidebar(false)
    );

    // New chat
    elements.newChatButton?.addEventListener(
      "click",
      startNewChat
    );

    // Clear chat
    elements.clearChatButton?.addEventListener(
      "click",
      () => {
        if (
          state.conversation.messages
            .length === 0
        ) {
          return;
        }

        clearChat();
      }
    );

    // Input
    elements.messageInput?.addEventListener(
      "input",
      handleInputResize
    );

    elements.messageInput?.addEventListener(
      "keydown",
      handleKeyDown
    );

    // Send
    elements.sendButton?.addEventListener(
      "click",
      () => sendMessage()
    );

    // Stop
    elements.stopButton?.addEventListener(
      "click",
      stopGeneration
    );

    // Attachment
    elements.attachButton?.addEventListener(
      "click",
      () =>
        elements.fileInput?.click()
    );

    elements.fileInput?.addEventListener(
      "change",
      handleFileSelect
    );

    elements.removeAttachment?.addEventListener(
      "click",
      removeAttachment
    );

    // Voice
    elements.voiceButton?.addEventListener(
      "click",
      toggleVoiceInput
    );

    // Theme
    elements.themeButton?.addEventListener(
      "click",
      toggleTheme
    );

    // Search
    elements.chatSearch?.addEventListener(
      "input",
      event =>
        searchHistory(
          event.target.value
        )
    );

    // Share
    elements.shareButton?.addEventListener(
      "click",
      shareChat
    );

    // Web search
    elements.toolsButton?.addEventListener(
      "click",
      toggleTools
    );

    // Suggestions
    elements.suggestionCards.forEach(
      card => {
        card.addEventListener(
          "click",
          () => {
            const prompt =
              card.getAttribute(
                "data-prompt"
              );

            if (prompt) {
              sendMessage(prompt);
            }
          }
        );
      }
    );

    // Model selector
    setupModelSelector();

    // Settings
    elements.settingsButton?.addEventListener(
      "click",
      () => {
        if (
          elements.settingsModal &&
          typeof elements.settingsModal.showModal ===
            "function"
        ) {
          elements.settingsModal.showModal();
        }
      }
    );

    elements.closeSettingsModal?.addEventListener(
      "click",
      () => {
        if (
          elements.settingsModal &&
          typeof elements.settingsModal.close ===
            "function"
        ) {
          elements.settingsModal.close();
        }
      }
    );

    // Escape closes mobile sidebar
    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape"
        ) {
          if (
            elements.sidebar?.classList.contains(
              "active"
            )
          ) {
            toggleSidebar(false);
          }
        }
      }
    );
  }

  // ==========================================================
  // INITIAL HISTORY RENDER
  // ==========================================================

  function initializeHistory() {
    renderHistory();
  }

  // ==========================================================
  // START APPLICATION
  // ==========================================================

  init();

  initializeHistory();
});
