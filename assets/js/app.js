document.addEventListener("DOMContentLoaded", () => {
  // Helper to safely get elements without crashing
  const el = (id) => document.getElementById(id);

  const sidebar = el("sidebar");
  const sidebarOverlay = el("sidebarOverlay");
  const openSidebarBtn = el("openSidebar");
  const closeSidebarBtn = el("closeSidebar");
  const modelSelector = el("modelSelector");
  const modelDropdown = el("modelDropdown");
  const messageInput = el("messageInput");
  const sendButton = el("sendButton");
  const chatArea = el("chatArea");
  const welcomeScreen = el("welcomeScreen");
  const messagesList = el("messages");

  let conversationHistory = [];
  let activeModel = "gemini-2.0-flash";
  let isGenerating = false;

  // 1. Sidebar Toggle (Anti-Freeze)
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

  // 2. Dropdown Logic
  if (modelSelector && modelDropdown) {
    modelSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      modelDropdown.toggleAttribute("hidden");
    });
    document.addEventListener("click", () => modelDropdown.setAttribute("hidden", ""));
  }

  // 3. Input Handling
  if (messageInput) {
    messageInput.addEventListener("input", () => {
      messageInput.style.height = "auto";
      messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + "px";
      if (sendButton) sendButton.disabled = !messageInput.value.trim();
    });

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled && !isGenerating) handleSendMessage();
      }
    });
  }

  // 4. Send Message to Cloudflare Backend
  async function handleSendMessage() {
    const text = messageInput.value.trim();
    if (!text || isGenerating) return;

    isGenerating = true;
    if (welcomeScreen) welcomeScreen.style.display = "none";

    // Show user message
    conversationHistory.push({ role: "user", parts: [{ text: text }] });
    renderMessage("user", text);

    // Reset input
    messageInput.value = "";
    messageInput.style.height = "auto";
    if (sendButton) sendButton.disabled = true;

    const thinkingNode = renderThinkingIndicator();

    try {
      // Call your Cloudflare function securely
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

      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }

      // Show AI message
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

  // 5. Render Helpers
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
