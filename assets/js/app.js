document.addEventListener("DOMContentLoaded", () => {
    // --- State Management ---
    let conversationHistory = []; // Stores multi-turn chat memory [{role: 'user'|'model', content: '...'}]
    let currentAbortController = null;
    let isGenerating = false;

    // --- DOM Elements ---
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const openSidebarBtn = document.getElementById("openSidebar");
    const closeSidebarBtn = document.getElementById("closeSidebar");
    
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const stopButton = document.getElementById("stopButton");
    const messagesContainer = document.getElementById("messages");
    const welcomeScreen = document.getElementById("welcomeScreen");
    const chatArea = document.getElementById("chatArea");
    
    const newChatButton = document.getElementById("newChatButton");
    const clearChatButton = document.getElementById("clearChatButton");
    const themeButton = document.getElementById("themeButton");
    const modelSelector = document.getElementById("modelSelector");
    const modelDropdown = document.getElementById("modelDropdown");
    
    const suggestionCards = document.querySelectorAll(".suggestion-card");

    // --- UI Event Handlers ---

    // Sidebar Toggles
    function toggleSidebar() {
        sidebar.classList.toggle("open");
        if (sidebarOverlay) sidebarOverlay.classList.toggle("active");
    }

    if (openSidebarBtn) openSidebarBtn.addEventListener("click", toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", toggleSidebar);

    // Model Dropdown Toggle
    if (modelSelector && modelDropdown) {
        modelSelector.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = modelDropdown.hasAttribute("hidden");
            if (isHidden) {
                modelDropdown.removeAttribute("hidden");
                modelSelector.setAttribute("aria-expanded", "true");
            } else {
                modelDropdown.setAttribute("hidden", "");
                modelSelector.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("click", () => {
            modelDropdown.setAttribute("hidden", "");
            modelSelector.setAttribute("aria-expanded", "false");
        });

        // Model selection options
        document.querySelectorAll(".model-option").forEach(option => {
            option.addEventListener("click", () => {
                document.querySelectorAll(".model-option").forEach(opt => opt.classList.remove("active"));
                option.classList.add("active");
                const modelNameSpan = modelSelector.querySelector(".model-name");
                if (modelNameSpan) {
                    modelNameSpan.textContent = option.querySelector("strong").textContent.trim();
                }
            });
        });
    }

    // Theme Toggle (Light/Dark basic switcher)
    if (themeButton) {
        themeButton.addEventListener("click", () => {
            document.body.classList.toggle("light-theme");
            const isLight = document.body.classList.contains("light-theme");
            themeButton.querySelector("span:first-child").textContent = isLight ? "🌙" : "☀️";
        });
    }

    // Textarea Auto-resize & Send Button State
    if (messageInput) {
        messageInput.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
            if (sendButton) {
                sendButton.disabled = this.value.trim() === "" && !isGenerating;
            }
        });

        messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!sendButton.disabled && !isGenerating) {
                    handleSendMessage();
                }
            }
        });
    }

    if (sendButton) {
        sendButton.addEventListener("click", () => {
            if (!isGenerating) handleSendMessage();
        });
    }

    // Suggestion Cards Click
    suggestionCards.forEach(card => {
        card.addEventListener("click", () => {
            const promptText = card.getAttribute("data-prompt");
            if (promptText && messageInput) {
                messageInput.value = promptText;
                messageInput.style.height = "auto";
                messageInput.style.height = (messageInput.scrollHeight) + "px";
                if (sendButton) sendButton.disabled = false;
                handleSendMessage();
            }
        });
    });

    // New Chat Action
    function resetChat() {
        if (isGenerating && currentAbortController) {
            currentAbortController.abort();
        }
        conversationHistory = [];
        if (messagesContainer) messagesContainer.innerHTML = "";
        if (welcomeScreen) welcomeScreen.style.display = "flex";
        if (messageInput) {
            messageInput.value = "";
            messageInput.style.height = "auto";
        }
        if (sendButton) sendButton.disabled = true;
        setGeneratingState(false);
    }

    if (newChatButton) newChatButton.addEventListener("click", resetChat);
    if (clearChatButton) clearChatButton.addEventListener("click", resetChat);

    // Stop Generation Button
    if (stopButton) {
        stopButton.addEventListener("click", () => {
            if (currentAbortController) {
                currentAbortController.abort();
                isGenerating = false;
                setGeneratingState(false);
                appendSystemMessage("Generation stopped by user.");
            }
        });
    }

    // --- Core Chat Logic & API Communication ---

    function setGeneratingState(generating) {
        isGenerating = generating;
        if (sendButton && stopButton) {
            if (generating) {
                sendButton.hidden = true;
                sendButton.disabled = true;
                stopButton.hidden = false;
            } else {
                sendButton.hidden = false;
                sendButton.disabled = messageInput.value.trim() === "";
                stopButton.hidden = true;
            }
        }
    }

    function appendMessage(role, text) {
        if (welcomeScreen && welcomeScreen.style.display !== "none") {
            welcomeScreen.style.display = "none";
        }

        const messageDiv = document.createElement("div");
        messageDiv.className = `message-row ${role === 'user' ? 'user-message' : 'ai-message'}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = role === 'user' ? 'P' : '✦';

        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";

        if (role === 'user') {
            contentDiv.textContent = text; // Safe text for user input
        } else {
            // Render basic formatted markdown/text safely for AI output
            contentDiv.innerHTML = formatMarkdown(text);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function appendSystemMessage(errorText) {
        if (welcomeScreen && welcomeScreen.style.display !== "none") {
            welcomeScreen.style.display = "none";
        }

        const messageDiv = document.createElement("div");
        messageDiv.className = "message-row system-error-message";
        messageDiv.style.cssText = "padding: 12px; margin: 10px 0; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: var(--text-primary, #f87171); font-size: 0.9rem;";
        messageDiv.innerHTML = `<strong>Prasun AI Error:</strong><br><pre style="white-space: pre-wrap; margin-top: 6px; font-family: inherit;">${escapeHtml(errorText)}</pre>`;
        
        messagesContainer.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Lightweight safe HTML escape & markdown formatter
    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function formatMarkdown(text) {
        let safe = escapeHtml(text);
        // Code blocks
        safe = safe.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        // Inline code
        safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Bold text
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Line breaks
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }

    async function handleSendMessage() {
        const text = messageInput.value.trim();
        if (!text || isGenerating) return;

        // Clear input box
        messageInput.value = "";
        messageInput.style.height = "auto";

        // Append user message to UI and history
        appendMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        // Maintain conversation history window (last 20 messages)
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        setGeneratingState(true);
        currentAbortController = new AbortController();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
                signal: currentAbortController.signal
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || `HTTP error! Status: ${response.status}`);
            }

            const aiReply = data.response;
            appendMessage('assistant', aiReply);
            conversationHistory.push({ role: 'model', content: aiReply });

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Request aborted.");
            } else {
                console.error("Chat request failed:", err);
                appendSystemMessage(err.message || "Failed to communicate with the AI backend.");
            }
        } finally {
            setGeneratingState(false);
            currentAbortController = null;
        }
    }
});
