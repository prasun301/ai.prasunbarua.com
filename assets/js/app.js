document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const sendBtn = document.getElementById("send-btn");

  // Configure Marked.js options
  if (typeof marked !== "undefined") {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  // Helper: Append a new message bubble to chat
  function appendMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", role === "user" ? "user-message" : "ai-message");

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");

    if (role === "ai") {
      renderMarkdown(contentDiv, content);
    } else {
      contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return contentDiv;
  }

  // Helper: Render Markdown and Code Syntax Highlighting
  function renderMarkdown(element, rawText) {
    if (typeof marked !== "undefined") {
      element.innerHTML = marked.parse(rawText);

      if (typeof hljs !== "undefined") {
        element.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    } else {
      element.textContent = rawText;
    }
  }

  // Helper: Call API Endpoint
  async function getAIResponse(messageText) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.response || data.reply || data.text || data.message;

    if (!replyText) {
      throw new Error("The AI returned an empty response format.");
    }

    return replyText;
  }

  // Handle Form Submission
  async function sendMessage(e) {
    e.preventDefault();

    const messageText = userInput.value.trim();
    if (!messageText) return;

    // Add user message
    appendMessage("user", messageText);
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Add temporary loading indicator
    const aiContentDiv = appendMessage("ai", "Thinking...");

    try {
      const reply = await getAIResponse(messageText);
      renderMarkdown(aiContentDiv, reply);
    } catch (err) {
      aiContentDiv.textContent = `Sorry, I couldn't process your request right now.\n${err.message}`;
      aiContentDiv.classList.add("error-text");
    } finally {
      userInput.disabled = false;
      sendBtn.disabled = false;
      userInput.focus();
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  chatForm.addEventListener("submit", sendMessage);
});
