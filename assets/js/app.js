document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. ADD YOUR API KEY HERE FOR LOCAL TESTING
  // ==========================================
  const GEMINI_API_KEY = "PASTE_YOUR_API_KEY_HERE"; 

  // Safely get elements so the script doesn't crash if one is missing
  const el = (id) => document.getElementById(id);

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
  const newChatButton = el("newChatButton");
  const clearChatButton = el("clearChatButton");

  let conversationHistory = [];
  let activeModel = "gemini-2.0-flash";
  let attachedFile = null;
  let isGenerating = false;

  // ==========================================
  // 2. SIDEBAR TOGGLE (Fixes Frozen Buttons)
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

  // ==========================================
  // 3. MODEL SELECTOR
  // ==========================================
  if (modelSelector && modelDropdown) {
    modelSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = modelDropdown.hasAttribute("hidden");
      if (isHidden) {
        modelDropdown.removeAttribute("hidden");
      } else {
        modelDropdown.setAttribute("hidden", "");
      }
    });

    document.addEventListener("click", () => {
      modelDropdown.setAttribute("hidden", "");
    });

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
  // 4. CHAT INPUT & ATTACHMENTS
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

  // ==========================================
  // 5. SEND MESSAGE & DIRECT API CALL
  // ==========================================
  async function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text && !attachedFile) return;
    if (isGenerating) return;

    isGenerating = true;
    if (welcomeScreen) welcomeScreen.style.display = "none";

    // 1. Show User Message
    const userMsg = { role: "user", parts: [{ text: text }] };
    conversationHistory.push(userMsg);
    renderMessage("user", text);

    // 2. Clear Input
    messageInput.value = "";
    messageInput.style.height = "auto";
    if (sendButton) sendButton.disabled = true;

    // 3. Show Loading Bubble
    const thinkingNode = renderThinkingIndicator();

    try {
      if (GEMINI_API_KEY === "PASTE_YOUR_API_KEY_HERE") {
        throw new Error("API Key is missing! Please add it to the top of app.js");
      }

      // Direct call to Google Gemini API (Bypasses backend requirement)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: conversationHistory })
      });

      const data = await response.json();
      thinkingNode.remove();

      if (!response.ok) {
        throw new Error(data.error?.message || "API Error");
      }

      // 4. Show AI Response
      const aiText = data.candidates[0].content.parts[0].text;
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
  // 6. UI RENDERING HELPERS
  // ==========================================
  function renderMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender === "user" ? "user-message" : "ai-message"}`;
    
    const avatar = sender === "user" 
      ? `<div class="message-avatar">U</div>`
      : `<div class="message-avatar"><span class="material-symbols-outlined" style="font-size: 20px;">smart_toy</span></div>`;

    // Try to parse markdown if the library is loaded, otherwise just insert text safely
    let parsedContent = text;
    if (sender === "ai" && typeof marked !== "undefined") {
      parsedContent = marked.parse(text);
    } else {
      parsedContent = `<p>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    }

    msgDiv.innerHTML = `${avatar}<div class="message-content"><div class="message-bubble">${parsedContent}</div></div>`;
    messagesList.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function renderThinkingIndicator() {
    const thinkingDiv = document.createElement("div");
    thinkingDiv.className = "message ai-message";
    thinkingDiv.innerHTML = `
      <div class="message-avatar"><span class="material-symbols-outlined" style="font-size: 20px;">smart_toy</span></div>
      <div class="message-content">
        <div class="thinking-indicator">
          <div class="dot-pulse"></div><span>Prasun AI is thinking...</span>
        </div>
      </div>`;
    messagesList.appendChild(thinkingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return thinkingDiv;
  }

  function renderErrorMessage(text) {
    const errDiv = document.createElement("div");
    errDiv.className = "message ai-message";
    errDiv.innerHTML = `
      <div class="message-avatar" style="color: #d93838;"><span class="material-symbols-outlined">error</span></div>
      <div class="message-content"><div class="message-bubble" style="color: #d93838; font-weight: 500;">${text}</div></div>`;
    messagesList.appendChild(errDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // New Chat Button
  if (newChatButton) {
    newChatButton.addEventListener("click", () => {
      conversationHistory = [];
      messagesList.innerHTML = "";
      if (welcomeScreen) welcomeScreen.style.display = "flex";
    });
  }
});
