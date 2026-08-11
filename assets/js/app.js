"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // PRASUN AI — MAIN APPLICATION
  // =========================================================

  // ---------------------------------------------------------
  // Helper
  // ---------------------------------------------------------

  const el = (id) => document.getElementById(id);

  // ---------------------------------------------------------
  // Core UI elements
  // ---------------------------------------------------------

  const sidebar = el("sidebar");
  const sidebarOverlay = el("sidebarOverlay");
  const openSidebarBtn = el("openSidebar");
  const closeSidebarBtn = el("closeSidebar");

  const modelSelector = el("modelSelector");
  const modelDropdown = el("modelDropdown");
  const currentModelLabel = modelSelector?.querySelector(".model-name");

  const messageInput = el("messageInput");
  const sendButton = el("sendButton");

  const attachButton = el("attachButton");
  const fileInput = el("fileInput");

  const chatArea = el("chatArea");
  const welcomeScreen = el("welcomeScreen");
  const messagesList = el("messages");

  const newChatButton = el("newChatButton");
  const clearChatButton = el("clearChatButton");

  const themeButton = el("themeButton");
  const settingsButton = el("settingsButton");

  const settingsModal = el("settingsModal");
  const closeSettingsModal = el("closeSettingsModal");
  const userNameInput = el("userNameInput");

  const chatSearchInput = el("chatSearchInput");
  const historyContainer = el("historyContainer");

  const suggestionCards =
    document.querySelectorAll(".suggestion-card");

  // =========================================================
  // APPLICATION STATE
  // =========================================================

  const STORAGE_KEY = "prasunAI_state_v1";

  let conversationHistory = [];
  let conversations = [];

  let currentConversationId = null;

  let activeModel = "gemini-3.6-flash";

  let attachedFile = null;

  let isGenerating = false;

  let userName = "Guest";

  // =========================================================
// MODEL CONFIGURATION
// =========================================================

const MODELS = {
  "gemini-3.6-flash": {
    name: "Gemini 3.6 Flash",
    description: "Fast & powerful"
  },

  "gemini-3.5-flash-lite": {
    name: "Gemini 3.5 Flash-Lite",
    description: "Fastest answers"
  },

  "gemini-3.1-pro": {
    name: "Gemini 3.1 Pro",
    description: "Extended thinking & complex problem solving"
  }
};

// =========================================================
// DEFAULT MODEL
// =========================================================

const DEFAULT_MODEL = "gemini-3.6-flash";

// =========================================================
// OLD MODEL MIGRATIONS
// =========================================================
//
// These are only for users who already have an older
// Prasun AI version saved in localStorage.
//

const MODEL_MIGRATIONS = {
  "gemini-2.0-flash": DEFAULT_MODEL,
  "gemini-2.0-flash-001": DEFAULT_MODEL,
  "gemini-2.0-flash-exp": DEFAULT_MODEL,
  "gemini-1.5-pro": DEFAULT_MODEL,
  "gemini-1.5-flash": DEFAULT_MODEL,
  "gemini-3.5-flash": "gemini-3.5-flash-lite"
};

  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  function saveState() {
    try {
      const state = {
        conversations,
        currentConversationId,
        activeModel,
        userName,
        darkTheme: document.body.classList.contains("dark-theme")
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

    } catch (error) {
      console.warn("Could not save Prasun AI state:", error);
    }
  }

  function loadState() {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      const state = JSON.parse(raw);

      if (Array.isArray(state.conversations)) {
        conversations = state.conversations;
      }

      if (state.userName) {
        userName = state.userName;
      }

      if (state.activeModel) {

        activeModel =
          MODEL_MIGRATIONS[state.activeModel] ||
          MODELS[state.activeModel]
            ? (
                MODEL_MIGRATIONS[state.activeModel] ||
                state.activeModel
              )
            : "gemini-3.6-flash";
      }

      if (state.darkTheme) {
        document.body.classList.add("dark-theme");
      }

      if (userNameInput) {
        userNameInput.value = userName;
      }

    } catch (error) {

      console.warn(
        "Could not load saved Prasun AI state:",
        error
      );

      conversations = [];
      currentConversationId = null;
      activeModel = "gemini-3.6-flash";
    }
  }

  // =========================================================
  // UTILITY FUNCTIONS
  // =========================================================

  function generateId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 9)
    );
  }

  function escapeHtml(text) {

    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function scrollChatToBottom() {

    if (!chatArea) return;

    requestAnimationFrame(() => {
      chatArea.scrollTop = chatArea.scrollHeight;
    });
  }

  function updateSendButton() {

    if (!sendButton) return;

    const hasText =
      messageInput &&
      messageInput.value.trim().length > 0;

    const hasAttachment = !!attachedFile;

    sendButton.disabled =
      (!hasText && !hasAttachment) ||
      isGenerating;
  }

  // =========================================================
  // SIDEBAR
  // =========================================================

  function openSidebar() {

    if (!sidebar) return;

    if (window.innerWidth <= 768) {

      sidebar.classList.add("open");

      if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
      }

    } else {

      sidebar.classList.remove("collapsed");
    }
  }

  function closeSidebar() {

    if (!sidebar) return;

    if (window.innerWidth <= 768) {

      sidebar.classList.remove("open");

      if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
      }

    } else {

      sidebar.classList.add("collapsed");
    }
  }

  function toggleSidebar() {

    if (!sidebar) return;

    if (window.innerWidth <= 768) {

      sidebar.classList.toggle("open");

      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle("active");
      }

    } else {

      sidebar.classList.toggle("collapsed");
    }
  }

  if (openSidebarBtn) {
    openSidebarBtn.addEventListener(
      "click",
      toggleSidebar
    );
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener(
      "click",
      toggleSidebar
    );
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener(
      "click",
      closeSidebar
    );
  }

  // =========================================================
  // THEME / APPEARANCE
  // =========================================================

  function toggleTheme() {

    document.body.classList.toggle("dark-theme");

    saveState();
  }

  if (themeButton) {

    themeButton.addEventListener(
      "click",
      toggleTheme
    );
  }

  // =========================================================
  // SETTINGS
  // =========================================================

  function openSettings() {

    if (!settingsModal) return;

    if (userNameInput) {
      userNameInput.value = userName;
    }

    if (typeof settingsModal.showModal === "function") {

      if (!settingsModal.open) {
        settingsModal.showModal();
      }

    } else {

      settingsModal.setAttribute(
        "open",
        ""
      );
    }
  }

  function closeSettings() {

    if (userNameInput) {

      const value =
        userNameInput.value.trim();

      userName =
        value || "Guest";
    }

    saveState();

    if (!settingsModal) return;

    if (typeof settingsModal.close === "function") {

      if (settingsModal.open) {
        settingsModal.close();
      }

    } else {

      settingsModal.removeAttribute(
        "open"
      );
    }
  }

  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      openSettings
    );
  }

  if (closeSettingsModal) {

    closeSettingsModal.addEventListener(
      "click",
      closeSettings
    );
  }

  if (settingsModal) {

    settingsModal.addEventListener(
      "click",
      (event) => {

        if (event.target === settingsModal) {
          closeSettings();
        }

      }
    );
  }

  if (userNameInput) {

    userNameInput.addEventListener(
      "input",
      () => {

        userName =
          userNameInput.value.trim() ||
          "Guest";

        saveState();
      }
    );
  }

  // =========================================================
  // MODEL DROPDOWN
  // =========================================================

  function migrateModel(model) {

    if (MODEL_MIGRATIONS[model]) {
      return MODEL_MIGRATIONS[model];
    }

    if (MODELS[model]) {
      return model;
    }

    return "gemini-3.6-flash";
  }

  function updateModelLabel() {

    if (!currentModelLabel) return;

    const model =
      MODELS[activeModel] ||
      MODELS["gemini-3.6-flash"];

    currentModelLabel.textContent =
      model.name;
  }

  function prepareModelOptions() {

    const options =
      document.querySelectorAll(
        ".model-option"
      );

    if (!options.length) return;

    /*
     * The original HTML contains old models.
     * Replace them with currently supported models.
     */

    const modelIds =
      Object.keys(MODELS);

    options.forEach((option, index) => {

      const modelId =
        modelIds[index];

      if (!modelId) return;

      option.dataset.model =
        modelId;

      const strong =
        option.querySelector("strong");

      const small =
        option.querySelector("small");

      if (strong) {
        strong.textContent =
          MODELS[modelId].name;
      }

      if (small) {
        small.textContent =
          MODELS[modelId].description;
      }

      option.classList.toggle(
        "active",
        activeModel === modelId
      );
    });

    activeModel =
      migrateModel(activeModel);

    updateModelLabel();
  }

  if (modelSelector && modelDropdown) {

    modelSelector.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        const isHidden =
          modelDropdown.hasAttribute(
            "hidden"
          );

        if (isHidden) {

          modelDropdown.removeAttribute(
            "hidden"
          );

          modelSelector.setAttribute(
            "aria-expanded",
            "true"
          );

        } else {

          modelDropdown.setAttribute(
            "hidden",
            ""
          );

          modelSelector.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );

    document.addEventListener(
      "click",
      () => {

        modelDropdown.setAttribute(
          "hidden",
          ""
        );

        modelSelector.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    );
  }

  document
    .querySelectorAll(".model-option")
    .forEach((option) => {

      option.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          let selectedModel =
            option.dataset.model;

          selectedModel =
            migrateModel(selectedModel);

          activeModel =
            selectedModel;

          document
            .querySelectorAll(
              ".model-option"
            )
            .forEach((item) => {

              item.classList.remove(
                "active"
              );
            });

          option.classList.add(
            "active"
          );

          updateModelLabel();

          saveState();

          if (modelDropdown) {

            modelDropdown.setAttribute(
              "hidden",
              ""
            );
          }

          if (modelSelector) {

            modelSelector.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        }
      );
    });

  // =========================================================
  // NEW CHAT
  // =========================================================

  function resetCurrentChat() {

    conversationHistory = [];

    currentConversationId = null;

    attachedFile = null;

    if (messagesList) {
      messagesList.innerHTML = "";
    }

    if (welcomeScreen) {
      welcomeScreen.style.display = "flex";
    }

    if (messageInput) {

      messageInput.value = "";

      messageInput.style.height =
        "auto";
    }

    if (attachButton) {

      attachButton.style.color = "";
    }

    updateSendButton();

    renderHistory();

    saveState();

    if (messageInput) {
      messageInput.focus();
    }
  }

  if (newChatButton) {

    newChatButton.addEventListener(
      "click",
      resetCurrentChat
    );
  }

  if (clearChatButton) {

    clearChatButton.addEventListener(
      "click",
      () => {

        if (
          conversationHistory.length === 0
        ) {
          resetCurrentChat();
          return;
        }

        const confirmed =
          window.confirm(
            "Clear this conversation?"
          );

        if (confirmed) {
          resetCurrentChat();
        }
      }
    );
  }

  // =========================================================
  // SUGGESTION CARDS
  // =========================================================

  suggestionCards.forEach(
    (card) => {

      card.addEventListener(
        "click",
        () => {

          const prompt =
            card.dataset.prompt ||
            card.querySelector("p")
              ?.textContent ||
            "";

          if (!messageInput) return;

          messageInput.value =
            prompt.trim();

          messageInput.style.height =
            "auto";

          messageInput.style.height =
            Math.min(
              messageInput.scrollHeight,
              200
            ) + "px";

          updateSendButton();

          messageInput.focus();
        }
      );
    }
  );

  // =========================================================
  // INPUT HANDLING
  // =========================================================

  if (messageInput) {

    messageInput.addEventListener(
      "input",
      () => {

        messageInput.style.height =
          "auto";

        messageInput.style.height =
          Math.min(
            messageInput.scrollHeight,
            200
          ) + "px";

        updateSendButton();
      }
    );

    messageInput.addEventListener(
      "keydown",
      (event) => {

        /*
         * Enter = send
         * Shift + Enter = new line
         */

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          if (
            !isGenerating &&
            messageInput.value.trim()
          ) {

            handleSendMessage();
          }
        }
      }
    );
  }

  // =========================================================
  // ATTACHMENT BUTTON
  // =========================================================

  if (attachButton && fileInput) {

    attachButton.addEventListener(
      "click",
      () => {

        if (!isGenerating) {
          fileInput.click();
        }
      }
    );

    fileInput.addEventListener(
      "change",
      (event) => {

        const file =
          event.target.files?.[0];

        if (!file) {
          attachedFile = null;
          updateSendButton();
          return;
        }

        attachedFile = {
          name: file.name,
          type: file.type,
          size: file.size
        };

        attachButton.style.color =
          "var(--accent-color)";

        updateSendButton();
      }
    );
  }

  // =========================================================
  // SEND BUTTON
  // =========================================================

  if (sendButton) {

    sendButton.addEventListener(
      "click",
      handleSendMessage
    );
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function handleSendMessage() {

    if (isGenerating) return;

    const text =
      messageInput?.value.trim() ||
      "";

    /*
     * The current backend supports text
     * messages. Attachments are therefore
     * displayed as selected but are not yet
     * uploaded to Gemini.
     */

    if (!text) {

      if (attachedFile) {

        renderErrorMessage(
          "File attachments are selected, but file processing has not been enabled yet. Please send a text message for now."
        );

      }

      return;
    }

    isGenerating = true;

    updateSendButton();

    if (welcomeScreen) {
      welcomeScreen.style.display =
        "none";
    }

    // -------------------------------------------------------
    // Create conversation if necessary
    // -------------------------------------------------------

    if (!currentConversationId) {

      currentConversationId =
        generateId();

      conversations.unshift({
        id: currentConversationId,
        title:
          text.length > 60
            ? text.substring(0, 57) + "..."
            : text,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    // -------------------------------------------------------
    // Add user message
    // -------------------------------------------------------

    const userMessage = {
      role: "user",
      parts: [
        {
          text: text
        }
      ]
    };

    conversationHistory.push(
      userMessage
    );

    renderMessage(
      "user",
      text
    );

    updateCurrentConversation();

    if (messageInput) {

      messageInput.value = "";

      messageInput.style.height =
        "auto";
    }

    attachedFile = null;

    if (attachButton) {
      attachButton.style.color = "";
    }

    updateSendButton();

    const thinkingNode =
      renderThinkingIndicator();

    try {

      // -----------------------------------------------------
      // API request
      // -----------------------------------------------------

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
              model:
                migrateModel(activeModel),

              messages:
                conversationHistory
            })
          }
        );

      // -----------------------------------------------------
      // Read response safely
      // -----------------------------------------------------

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      // -----------------------------------------------------
      // API error
      // -----------------------------------------------------

      if (!response.ok) {

        const errorMessage =
          data?.error ||
          `Server error (${response.status})`;

        throw new Error(
          errorMessage
        );
      }

      const aiText =
        data?.response;

      if (
        !aiText ||
        typeof aiText !== "string"
      ) {

        throw new Error(
          "The AI returned an empty response."
        );
      }

      // -----------------------------------------------------
      // Add AI response
      // -----------------------------------------------------

      conversationHistory.push({
        role: "model",
        parts: [
          {
            text: aiText
          }
        ]
      });

      if (thinkingNode) {
        thinkingNode.remove();
      }

      renderMessage(
        "ai",
        aiText
      );

      updateCurrentConversation();

    } catch (error) {

      if (thinkingNode) {
        thinkingNode.remove();
      }

      console.error(
        "Prasun AI request failed:",
        error
      );

      renderErrorMessage(
        formatApiError(
          error?.message ||
          "Something went wrong."
        )
      );

    } finally {

      isGenerating = false;

      updateSendButton();

      if (messageInput) {
        messageInput.focus();
      }

      saveState();
      renderHistory();
    }
  }

  // =========================================================
  // API ERROR FORMATTER
  // =========================================================

  function formatApiError(message) {

    const lower =
      String(message).toLowerCase();

    if (
      lower.includes("quota") ||
      lower.includes("rate limit")
    ) {

      return (
        "Gemini API quota or rate limit was reached. " +
        "Please check your Gemini API billing/quota settings " +
        "and make sure the selected model is currently available."
      );
    }

    if (
      lower.includes("api key") ||
      lower.includes("gemini_api_key")
    ) {

      return (
        "The Gemini API key is missing or invalid. " +
        "Please check GEMINI_API_KEY in Cloudflare."
      );
    }

    if (
      lower.includes("model") &&
      lower.includes("not found")
    ) {

      return (
        "The selected Gemini model is unavailable. " +
        "Please select Gemini 3.6 Flash."
      );
    }

    if (
      lower.includes("failed to fetch")
    ) {

      return (
        "Could not connect to the Prasun AI server. " +
        "Please check your internet connection and try again."
      );
    }

    return escapeHtml(
      String(message)
    );
  }

  // =========================================================
  // RENDER USER / AI MESSAGE
  // =========================================================

  function renderMessage(
    sender,
    text
  ) {

    if (!messagesList) return;

    const msgDiv =
      document.createElement(
        "div"
      );

    msgDiv.className =
      `message ${
        sender === "user"
          ? "user-message"
          : "ai-message"
      }`;

    let parsedContent = "";

    if (
      sender === "ai" &&
      typeof marked !== "undefined"
    ) {

      try {

        parsedContent =
          marked.parse(
            String(text)
          );

      } catch {

        parsedContent =
          `<p>${escapeHtml(
            text
          )}</p>`;
      }

    } else {

      parsedContent =
        `<p>${escapeHtml(
          text
        )}</p>`;
    }

    msgDiv.innerHTML = `
      <div class="message-avatar ${
  sender === "ai" ? "ai-avatar" : "user-avatar-message"
}">
  ${
    sender === "user"
      ? escapeHtml(
          userName
            .charAt(0)
            .toUpperCase()
        )
      : `
        <span
          class="material-symbols-outlined"
          aria-hidden="true"
        >smart_toy</span>
      `
  }
</div>

      <div class="message-content">
        <div class="message-bubble">
          ${parsedContent}
        </div>
      </div>
    `;

    messagesList.appendChild(
      msgDiv
    );

    scrollChatToBottom();
  }

  // =========================================================
  // THINKING INDICATOR
  // =========================================================

  function renderThinkingIndicator() {

    if (!messagesList) {
      return null;
    }

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "message ai-message";

    div.innerHTML = `
      <div class="message-avatar ai-avatar">
  <span
    class="material-symbols-outlined"
    aria-hidden="true"
  >smart_toy</span>
</div>

      <div class="message-content">
        <div class="thinking-indicator">
          Thinking...
        </div>
      </div>
    `;

    messagesList.appendChild(
      div
    );

    scrollChatToBottom();

    return div;
  }

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  function renderErrorMessage(
    text
  ) {

    if (!messagesList) return;

    const div =
      document.createElement(
        "div"
      );

    div.className =
      "message ai-message";

    div.innerHTML = `
      <div
        class="message-avatar"
        style="color: red;"
      >
        !
      </div>

      <div class="message-content">
        <div
          class="message-bubble"
          style="color: red;"
        >
          ${text}
        </div>
      </div>
    `;

    messagesList.appendChild(
      div
    );

    scrollChatToBottom();
  }

  // =========================================================
  // CONVERSATION MANAGEMENT
  // =========================================================

  function getCurrentConversation() {

    if (!currentConversationId) {
      return null;
    }

    return conversations.find(
      (conversation) =>
        conversation.id ===
        currentConversationId
    ) || null;
  }

  function updateCurrentConversation() {

    const conversation =
      getCurrentConversation();

    if (!conversation) {
      return;
    }

    conversation.messages =
      conversationHistory;

    conversation.updatedAt =
      Date.now();

    saveState();

    renderHistory();
  }

  // =========================================================
  // LOAD CONVERSATION
  // =========================================================

  function loadConversation(
    conversationId
  ) {

    const conversation =
      conversations.find(
        (item) =>
          item.id ===
          conversationId
      );

    if (!conversation) {
      return;
    }

    currentConversationId =
      conversation.id;

    conversationHistory =
      Array.isArray(
        conversation.messages
      )
        ? conversation.messages.map(
            (message) => ({
              role:
                message.role,

              parts:
                Array.isArray(
                  message.parts
                )
                  ? message.parts.map(
                      (part) => ({
                        text:
                          part.text || ""
                      })
                    )
                  : []
            })
          )
        : [];

    if (messagesList) {
      messagesList.innerHTML =
        "";
    }

    if (welcomeScreen) {
      welcomeScreen.style.display =
        "none";
    }

    conversationHistory.forEach(
      (message) => {

        const text =
          message.parts
            ?.map(
              (part) =>
                part.text || ""
            )
            .join("") || "";

        renderMessage(
          message.role === "user"
            ? "user"
            : "ai",
          text
        );
      }
    );

    renderHistory();

    if (window.innerWidth <= 768) {
      closeSidebar();
    }

    if (messageInput) {
      messageInput.focus();
    }
  }

  // =========================================================
  // RENAME CONVERSATION
  // =========================================================

  function renameConversation(
    conversationId
  ) {

    const conversation =
      conversations.find(
        (item) =>
          item.id ===
          conversationId
      );

    if (!conversation) return;

    const newTitle =
      window.prompt(
        "Rename conversation:",
        conversation.title
      );

    if (
      newTitle === null
    ) {
      return;
    }

    const trimmed =
      newTitle.trim();

    if (!trimmed) {
      return;
    }

    conversation.title =
      trimmed;

    conversation.updatedAt =
      Date.now();

    saveState();

    renderHistory();
  }

  // =========================================================
  // DELETE CONVERSATION
  // =========================================================

  function deleteConversation(
    conversationId
  ) {

    const conversation =
      conversations.find(
        (item) =>
          item.id ===
          conversationId
      );

    if (!conversation) return;

    const confirmed =
      window.confirm(
        `Delete "${conversation.title}"?`
      );

    if (!confirmed) {
      return;
    }

    conversations =
      conversations.filter(
        (item) =>
          item.id !==
          conversationId
      );

    if (
      currentConversationId ===
      conversationId
    ) {

      conversationHistory = [];

      currentConversationId =
        null;

      if (messagesList) {
        messagesList.innerHTML =
          "";
      }

      if (welcomeScreen) {
        welcomeScreen.style.display =
          "flex";
      }

      if (messageInput) {
        messageInput.value = "";
        messageInput.style.height =
          "auto";
      }

      updateSendButton();
    }

    saveState();

    renderHistory();
  }

  // =========================================================
  // CHAT HISTORY RENDERING
  // =========================================================

  function renderHistory(
    searchTerm = ""
  ) {

    if (!historyContainer) {
      return;
    }

    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    historyContainer.innerHTML =
      "";

    const filtered =
      conversations.filter(
        (conversation) => {

          if (!normalizedSearch) {
            return true;
          }

          return conversation.title
            .toLowerCase()
            .includes(
              normalizedSearch
            );
        }
      );

    if (filtered.length === 0) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "history-empty";

      empty.textContent =
        normalizedSearch
          ? "No chats found"
          : "No conversations yet";

      historyContainer.appendChild(
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
      "Conversations";

    historyContainer.appendChild(
      title
    );

    filtered.forEach(
      (conversation) => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "history-item";

        if (
          conversation.id ===
          currentConversationId
        ) {
          item.classList.add(
            "active"
          );
        }

        item.innerHTML = `
          <div class="history-item-left">
            <span
              class="material-symbols-outlined"
              style="font-size: 18px;"
            >
              chat_bubble_outline
            </span>

            <span
              class="history-title"
              title="${escapeHtml(
                conversation.title
              )}"
            >
              ${escapeHtml(
                conversation.title
              )}
            </span>
          </div>

          <div class="history-actions">

            <button
              class="action-icon-btn rename-chat-btn"
              title="Rename"
              type="button"
              data-id="${conversation.id}"
            >
              <span
                class="material-symbols-outlined"
                style="font-size: 16px;"
              >
                edit
              </span>
            </button>

            <button
              class="action-icon-btn delete-chat-btn"
              title="Delete"
              type="button"
              data-id="${conversation.id}"
            >
              <span
                class="material-symbols-outlined"
                style="font-size: 16px;"
              >
                delete
              </span>
            </button>

          </div>
        `;

        // -----------------------------------------------------
        // Open conversation
        // -----------------------------------------------------

        item.addEventListener(
          "click",
          (event) => {

            if (
              event.target.closest(
                ".history-actions"
              )
            ) {
              return;
            }

            loadConversation(
              conversation.id
            );
          }
        );

        historyContainer.appendChild(
          item
        );
      }
    );

    // ---------------------------------------------------------
    // Rename buttons
    // ---------------------------------------------------------

    historyContainer
      .querySelectorAll(
        ".rename-chat-btn"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            (event) => {

              event.stopPropagation();

              renameConversation(
                button.dataset.id
              );
            }
          );
        }
      );

    // ---------------------------------------------------------
    // Delete buttons
    // ---------------------------------------------------------

    historyContainer
      .querySelectorAll(
        ".delete-chat-btn"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            (event) => {

              event.stopPropagation();

              deleteConversation(
                button.dataset.id
              );
            }
          );
        }
      );
  }

  // =========================================================
  // SEARCH CHATS
  // =========================================================

  if (chatSearchInput) {

    chatSearchInput.addEventListener(
      "input",
      () => {

        renderHistory(
          chatSearchInput.value
        );
      }
    );
  }

  // =========================================================
  // KEYBOARD SHORTCUT — CMD/CTRL + K
  // =========================================================

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {

        event.preventDefault();

        if (chatSearchInput) {

          chatSearchInput.focus();

          chatSearchInput.select();
        }
      }

      // Escape closes sidebar/model/settings
      if (event.key === "Escape") {

        if (
          modelDropdown &&
          !modelDropdown.hasAttribute(
            "hidden"
          )
        ) {

          modelDropdown.setAttribute(
            "hidden",
            ""
          );
        }

        if (
          settingsModal?.open
        ) {

          closeSettings();
        }

        if (
          window.innerWidth <= 768 &&
          sidebar?.classList.contains(
            "open"
          )
        ) {

          closeSidebar();
        }
      }
    }
  );

  // =========================================================
  // INITIALIZE APPLICATION
  // =========================================================

  loadState();

  prepareModelOptions();

  updateModelLabel();

  renderHistory();

  updateSendButton();

  // If there is no saved conversation,
  // show the welcome screen.

  if (
    conversationHistory.length === 0 &&
    welcomeScreen
  ) {

    welcomeScreen.style.display =
      "flex";
  }

  if (messageInput) {
    messageInput.focus();
  }

});
