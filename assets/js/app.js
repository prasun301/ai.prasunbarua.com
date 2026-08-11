document.addEventListener("DOMContentLoaded", () => {
  // Helper to safely get elements
  const el = (id) => document.getElementById(id);

  // Core UI Elements
  const sidebar = el("sidebar");
  const sidebarOverlay = el("sidebarOverlay");
  const openSidebarBtn = el("openSidebar");
  const closeSidebarBtn = el("closeSidebar");
  
  const modelSelector = el("modelSelector");
  const modelDropdown = el("modelDropdown");
  const modelOptions = document.querySelectorAll(".model-option");
  const currentModelLabel = modelSelector?.querySelector(".model-name");

  const messageInput = el("messageInput");
  const sendButton = el("sendButton");
  const attachButton = el("attachButton");
  const fileInput = el("fileInput");
  
  const chatArea = el("chatArea");
  const welcomeScreen = el("welcomeScreen");
  const messagesList = el("messages");
  
  // The buttons that were frozen
  const newChatButton = el("newChatButton"); // Sidebar button
  const clearChatButton = document.querySelector(".header-actions .material-symbols-outlined"); // Top right trash can
  const suggestionCards = document.querySelectorAll(".suggestion-card"); // The 4 center cards
  const themeButton = el("themeButton"); // Appearance button
  const settingsButton = el("settingsButton"); // Settings button

  let conversationHistory = [];
  let activeModel = "gemini-2.0-flash";
  let attachedFile = null;
  let isGenerating = false;

  // ==========================================
  // 1. SIDEBAR & THEME TOGGLES
  // ==========================================
  function toggleSidebar() {
    if (!sidebar) return;
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("open");
      if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  }

  if (openSidebarBtn) openSidebarBtn.addEventListener("click", toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
    });
  }

  // ==========================================
  // 2. NEW CHAT / CLEAR CHAT LOGIC
  // ==========================================
  function resetChat() {
    conversationHistory = [];
    if (messagesList) messagesList.innerHTML = "";
    if (welcomeScreen) welcomeScreen.style.display = "flex";
    if (messageInput) {
      messageInput.value = "";
      messageInput.style.height = "auto";
    }
    if (sendButton) sendButton.disabled = true;
  }

  if (newChatButton) newChatButton.addEventListener("click", resetChat);
  // Bind to the trash can icon in the top right
  if (clearChatButton) clearChatButton.addEventListener("click", resetChat);

  // ==========================================
  // 3. SUGGESTION CARDS LOGIC
  // ==========================================
  suggestionCards.forEach((card) => {
    card.addEventListener("click", () => {
      // Find the paragraph text inside the clicked card
      const promptText = card.querySelector("p")?.innerText || card.innerText;
      if (messageInput) {
        messageInput.value = promptText;
        messageInput.style.height = "auto";
        if (sendButton) sendButton.disabled = false;
        // Optionally auto-send:
        // handleSendMessage(); 
      }
    });
  });

  // ==========================================
  // 4. MODEL DROPDOWN
  // ==========================================
  if (modelSelector && modelDropdown) {
    modelSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      modelDropdown.toggleAttribute("hidden");
    });
    document.addEventListener("click", () => modelDropdown.setAttribute("hidden", ""));

    modelOptions.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        modelOptions.forEach((opt) => opt.classList.remove("active"));
        option.classList.add("active");
        activeModel = option.getAttribute("data-model") || "gemini-2.0-flash";
        if (currentModelLabel) currentModelLabel.innerText = option.querySelector("strong")?.innerText || "Gemini 2.0 Flash";
        modelDropdown.setAttribute("hidden", "");
      });
    });
  }

  // ==========================================
  // 5. INPUT & ATTACHMENTS
  // ==========================================
  if (messageInput) {
    messageInput.addEventListener("input", () => {
      messageInput.style.height = "auto";
      messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + "px";
      if (sendButton) sendButton.disabled = !messageInput.value.trim() && !attachedFile;
    });

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled && !isGenerating) handleSendMessage();
      }
    });
  }

  if (attachButton && fileInput) {
    attachButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        attachedFile = { name: file.name, type: file.type };
        attachButton.style.color = "var(--accent-color)";
        if (sendButton) sendButton.disabled = false;
      }
    });
  }

  // ==========================================
  // 6. SEND MESSAGE (CLOUDFLARE API CALL)
  // ==========================================
  async function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text && !attachedFile) return;
    if (isGenerating) return;

    isGenerating = true;
    if (welcomeScreen) welcomeScreen.style.display = "none";

    conversationHistory.push({ role: "user", parts: [{ text: text }] });
    renderMessage("user", text);

    messageInput.value = "";
    messageInput.style.height = "auto";
    if (sendButton) sendButton.disabled = true;

    const thinkingNode = renderThinkingIndicator();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeModel,
          messages: conversationHistory
        })
      });

      const data = await response.json();
      thinkingNode.remove();

      if (!response.ok) throw new Error(data.error || "Server error");

      const aiText = data.response;
      conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
      renderMessage("ai", aiText);

    } catch (err) {
      thinkingNode.remove();
      renderErrorMessage(err.message);
    } finally {
      isGenerating = false;
      if (messageInput) messageInput.focus();
    }
  }

  if (sendButton) sendButton.addEventListener("click", handleSendMessage);

  // ==========================================
  // 7. UI RENDERING HELPERS
  // ==========================================
  function renderMessage(sender, text) {
    if (!messagesList) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender === "user" ? "user-message" : "ai-message"}`;
    
    let parsedContent = text;
    if (sender === "ai" && typeof marked !== "undefined") {
      parsedContent = marked.parse(text);
    } else {
      parsedContent = `<p>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }

    msgDiv.innerHTML = `
      <div class="message-avatar">${sender === "user" ? "U" : "🤖"}</div>
      <div class="message-content"><div class="message-bubble">${parsedContent}</div></div>
    `;
    messagesList.appendChild(msgDiv);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }

  function renderThinkingIndicator() {
    if (!messagesList) return document.createElement("div");
    const div = document.createElement("div");
    div.className = "message ai-message";
    div.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content"><div class="thinking-indicator">Thinking...</div></div>`;
    messagesList.appendChild(div);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    return div;
  }

  function renderErrorMessage(text) {
    if (!messagesList) return;
    const div = document.createElement("div");
    div.className = "message ai-message";
    div.innerHTML = `
      <div class="message-avatar" style="color: red;">!</div>
      <div class="message-content"><div class="message-bubble" style="color: red;">${text}</div></div>`;
    messagesList.appendChild(div);
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }
});
