<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Prasun AI — Production AI Assistant powered by Google Gemini and Cloudflare AI.">
  <meta name="theme-color" content="#ffffff" id="themeColor">
  <title>Prasun AI</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <script src="assets/js/app.js" defer></script>
</head>
<body>
  <div class="app">
    
    <!-- Mobile Sidebar Drawer Backdrop -->
    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>

    <!-- Sidebar Navigation -->
    <aside id="sidebar" aria-label="Sidebar Navigation">
      <div class="sidebar-header">
        <div class="brand-title">
          <span class="brand-sparkle">✦</span>
          <span>Prasun AI</span>
        </div>
        <button class="icon-btn mobile-only" id="closeSidebar" aria-label="Close Sidebar">✕</button>
      </div>

      <div class="sidebar-action-container">
        <button class="new-chat-btn" id="newChatButton">
          <span class="btn-icon">+</span>
          <span>New chat</span>
        </button>
      </div>

      <div class="search-box">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="chatSearch" placeholder="Search chats..." aria-label="Search Chat History">
          <kbd class="keyboard-shortcut">⌘K</kbd>
        </div>
      </div>

      <!-- Real Dynamic Chat History List -->
      <div class="history-container" id="historyContainer" aria-label="Chat History">
        <!-- Loaded via app.js localStorage -->
      </div>

      <!-- Sidebar Footer Controls -->
      <div class="sidebar-footer">
        <button class="footer-nav-btn" id="themeButton">
          <span class="btn-icon">☀️</span>
          <span>Appearance</span>
        </button>
        <button class="footer-nav-btn" id="settingsButton">
          <span class="btn-icon">⚙️</span>
          <span>Settings</span>
        </button>

        <div class="user-profile-badge" id="userProfile">
          <div class="user-avatar">P</div>
          <div class="user-info">
            <span class="user-name">Prasun</span>
            <span class="user-plan">Gemini 3 Flash</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Workspace -->
    <main class="main-wrapper">
      
      <!-- Top Navigation Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="topbar-icon-btn" id="openSidebar" aria-label="Open Sidebar">☰</button>
          
          <div class="model-selector-wrapper">
            <button class="model-selector-btn" id="modelSelector" aria-expanded="false" aria-controls="modelDropdown">
              <span class="model-name">Prasun AI 4.0 PRO</span>
              <span class="dropdown-chevron">▼</span>
            </button>
            
            <div class="model-dropdown" id="modelDropdown" hidden>
              <div class="model-option active" data-model="prasun-4">
                <div class="model-option-header">
                  <strong>Prasun AI 4.0 PRO</strong>
                  <span class="badge">Active</span>
                </div>
                <small>Powered by Google Gemini 3 Flash</small>
              </div>
              <div class="model-option" data-model="prasun-3.5">
                <div class="model-option-header">
                  <strong>Prasun AI 3.5 Flash</strong>
                </div>
                <small>Standard fast inference mode</small>
              </div>
            </div>
          </div>
        </div>

        <div class="topbar-right">
          <button class="topbar-icon-btn" id="clearChatButton" title="Clear Current Chat" aria-label="Clear Current Chat">🗑️</button>
          <button class="topbar-icon-btn" id="shareButton" title="Share / Copy Conversation" aria-label="Share Conversation">🔗</button>
        </div>
      </header>

      <!-- Chat Workspace Area -->
      <div class="chat-area" id="chatArea" tabIndex="0">
        
        <!-- Welcome Screen (Visible on fresh/empty conversation) -->
        <div class="welcome-screen" id="welcomeScreen">
          <div class="welcome-hero-icon">✦</div>
          <div class="welcome-text-group">
            <h1 class="welcome-title">How can I help you today?</h1>
            <p class="welcome-subtitle">
              Ask Prasun AI anything. Powered by Google Gemini 3 Flash via Cloudflare AI.
            </p>
          </div>

          <div class="suggestion-grid">
            <button class="suggestion-card" data-prompt="Explain how solar panels generate electricity in simple terms.">
              <div class="card-icon">⚡</div>
              <div class="card-text">
                <h4>Explain solar energy</h4>
                <p>How solar panels generate electricity</p>
              </div>
            </button>
            <button class="suggestion-card" data-prompt="Help me outline a clean website structure for a web development portfolio.">
              <div class="card-icon">🌐</div>
              <div class="card-text">
                <h4>Website structure</h4>
                <p>Help me write a professional website</p>
              </div>
            </button>
            <button class="suggestion-card" data-prompt="Give me a step-by-step guide to learn JavaScript for beginners.">
              <div class="card-icon">💻</div>
              <div class="card-text">
                <h4>Learn JavaScript</h4>
                <p>Step-by-step beginner guide</p>
              </div>
            </button>
            <button class="suggestion-card" data-prompt="Tell me 5 interesting and lesser-known facts about space.">
              <div class="card-icon">✨</div>
              <div class="card-text">
                <h4>Science facts</h4>
                <p>Five interesting facts about space</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Dynamic Message List -->
        <div class="messages-list" id="messages"></div>
      </div>

      <!-- Bottom Floating Composer -->
      <div class="composer-container">
        
        <!-- Attachment Indicator (Non-functional stub kept for visual completeness) -->
        <div class="attachment-preview" id="attachmentPreview" hidden>
          <span id="attachmentName">file.txt</span>
          <span id="attachmentSize" class="file-size-tag">0 KB</span>
          <button id="removeAttachment" class="remove-att-btn" aria-label="Remove attachment">✕</button>
        </div>

        <div class="composer-box">
          <textarea 
            id="messageInput" 
            class="message-textarea" 
            placeholder="Message Prasun AI..." 
            rows="1"
            aria-label="Message Input"
          ></textarea>
          
          <div class="composer-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn" id="attachButton" title="Attach Text/Code File">📎 Attach</button>
              <input type="file" id="fileInput" accept=".txt,.js,.json,.html,.css,.md" hidden>
              <button class="toolbar-btn" id="toolsButton" title="Web Search (Coming Soon)">🌐 Search</button>
              <button class="toolbar-btn" id="voiceButton" title="Voice Input">🎙️ Dictate</button>
            </div>

            <div class="toolbar-right">
              <button class="send-btn" id="sendButton" disabled aria-label="Send Message">
                <span class="send-icon">⬆</span>
              </button>
              <button class="stop-btn" id="stopButton" hidden aria-label="Stop Generation">
                <span class="stop-icon">■</span>
              </button>
            </div>
          </div>
        </div>

        <div class="disclaimer-text">
          Prasun AI can make mistakes. Verify important facts and information.
        </div>
      </div>

    </main>
  </div>

  <!-- Settings Modal -->
  <dialog class="modal-dialog" id="settingsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Settings</h3>
        <button class="icon-btn" id="closeSettingsModal" aria-label="Close Modal">✕</button>
      </div>
      <div class="modal-body">
        <div class="setting-row">
          <label for="backendStatus">Backend Architecture</label>
          <input type="text" id="backendStatus" value="Cloudflare Workers AI (Binding: context.env.AI)" readonly>
        </div>
        <div class="setting-row">
          <label for="activeModelInput">Active AI Model</label>
          <input type="text" id="activeModelInput" value="google/gemini-3-flash" readonly>
        </div>
      </div>
    </div>
  </dialog>

  <!-- Toast Notification Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>
</body>
</html>
