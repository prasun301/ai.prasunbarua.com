/* =========================================================
PRASUN AI
Frontend Application
========================================================= */

"use strict";

/* =========================================================
ELEMENTS
========================================================= */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const openSidebarButton = document.getElementById("openSidebar");
const closeSidebarButton = document.getElementById("closeSidebar");

const newChatButton = document.getElementById("newChatButton");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const messagesContainer = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");

const themeButton = document.getElementById("themeButton");

const chatSearch = document.getElementById("chatSearch");

const suggestionCards =
document.querySelectorAll(".suggestion-card");

const historyItems =
document.querySelectorAll(".history-item");

/* =========================================================
SIDEBAR
========================================================= */

function openSidebar() {

```
if (!sidebar) return;

sidebar.classList.add("open");

if (sidebarOverlay) {
    sidebarOverlay.classList.add("active");
}
```

}

function closeSidebar() {

```
if (!sidebar) return;

sidebar.classList.remove("open");

if (sidebarOverlay) {
    sidebarOverlay.classList.remove("active");
}
```

}

if (openSidebarButton) {

```
openSidebarButton.addEventListener(
    "click",
    openSidebar
);
```

}

if (closeSidebarButton) {

```
closeSidebarButton.addEventListener(
    "click",
    closeSidebar
);
```

}

if (sidebarOverlay) {

```
sidebarOverlay.addEventListener(
    "click",
    closeSidebar
);
```

}

/* =========================================================
TEXTAREA
========================================================= */

function resizeTextarea() {

```
if (!messageInput) return;

messageInput.style.height = "auto";

const newHeight =
    Math.min(
        messageInput.scrollHeight,
        180
    );

messageInput.style.height =
    `${newHeight}px`;
```

}

function updateSendButton() {

```
if (!messageInput || !sendButton) {
    return;
}

const text =
    messageInput.value.trim();

sendButton.disabled =
    text.length === 0;
```

}

if (messageInput) {

```
messageInput.addEventListener(
    "input",
    () => {

        resizeTextarea();
        updateSendButton();

    }
);
```

}

/* =========================================================
CREATE MESSAGE
========================================================= */

function createUserMessage(text) {

```
const message =
    document.createElement("div");

message.className =
    "message user";

const content =
    document.createElement("div");

content.className =
    "message-content";

content.textContent =
    text;

message.appendChild(content);

messagesContainer.appendChild(message);
```

}

function createAIMessage(text) {

```
const message =
    document.createElement("div");

message.className =
    "message ai";

const avatar =
    document.createElement("div");

avatar.className =
    "ai-avatar";

avatar.textContent =
    "✦";

const content =
    document.createElement("div");

content.className =
    "message-content";

content.textContent =
    text;

message.appendChild(avatar);

message.appendChild(content);

messagesContainer.appendChild(message);
```

}

/* =========================================================
TEMPORARY AI RESPONSE
========================================================= */

function generateTemporaryResponse(userText) {

```
const text =
    userText.toLowerCase();

if (
    text.includes("hello") ||
    text.includes("hi")
) {

    return (
        "Hello! 👋 I'm Prasun AI. " +
        "I'm ready to help you."
    );

}


if (
    text.includes("solar") ||
    text.includes("electricity")
) {

    return (
        "Solar panels convert sunlight into " +
        "electricity using photovoltaic cells. " +
        "When sunlight strikes the semiconductor " +
        "material, it creates an electric current. " +
        "In the next stage of development, " +
        "Prasun AI will provide real AI-generated " +
        "answers to questions like this."
    );

}


if (
    text.includes("javascript") ||
    text.includes("code")
) {

    return (
        "JavaScript is a programming language " +
        "commonly used to make websites interactive. " +
        "Prasun AI will eventually be able to " +
        "generate, explain and debug code using " +
        "a real AI model."
    );

}


return (
    "Thanks for your message! 👍\n\n" +
    "The Prasun AI interface is working. " +
    "Right now this is a frontend test response. " +
    "In the next stage, we'll connect this interface " +
    "to a real AI model through a secure backend."
);
```

}

/* =========================================================
SEND MESSAGE
========================================================= */

function sendMessage() {

```
if (!messageInput) return;

const text =
    messageInput.value.trim();

if (!text) return;


/* Hide welcome screen */

if (welcomeScreen) {

    welcomeScreen.style.display =
        "none";

}


/* Add user message */

createUserMessage(text);


/* Clear input */

messageInput.value = "";

messageInput.style.height =
    "auto";

updateSendButton();


/* Scroll */

scrollToBottom();


/* Temporary AI response */

setTimeout(
    () => {

        const response =
            generateTemporaryResponse(text);

        createAIMessage(response);

        scrollToBottom();

    },
    600
);
```

}

/* =========================================================
SEND BUTTON
========================================================= */

if (sendButton) {

```
sendButton.addEventListener(
    "click",
    sendMessage
);
```

}

/* =========================================================
ENTER TO SEND
========================================================= */

if (messageInput) {

```
messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);
```

}

/* =========================================================
SCROLL
========================================================= */

function scrollToBottom() {

```
if (!messagesContainer) return;

setTimeout(
    () => {

        messagesContainer.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });

    },
    50
);
```

}

/* =========================================================
NEW CHAT
========================================================= */

if (newChatButton) {

```
newChatButton.addEventListener(
    "click",
    () => {

        messagesContainer.innerHTML =
            "";

        if (welcomeScreen) {

            welcomeScreen.style.display =
                "flex";

        }

        if (messageInput) {

            messageInput.value =
                "";

            messageInput.style.height =
                "auto";

        }

        updateSendButton();

        closeSidebar();

        if (messageInput) {

            messageInput.focus();

        }

    }
);
```

}

/* =========================================================
SUGGESTIONS
========================================================= */

suggestionCards.forEach(
(card) => {

```
    card.addEventListener(
        "click",
        () => {

            const prompt =
                card.dataset.prompt;

            if (!prompt) return;

            messageInput.value =
                prompt;

            resizeTextarea();

            updateSendButton();

            messageInput.focus();

        }
    );

}
```

);

/* =========================================================
DARK / LIGHT MODE
========================================================= */

function applySavedTheme() {

```
const savedTheme =
    localStorage.getItem(
        "prasun-ai-theme"
    );

if (savedTheme === "dark") {

    document.body.classList.add(
        "dark"
    );

}
```

}

function toggleTheme() {

```
document.body.classList.toggle(
    "dark"
);

const isDark =
    document.body.classList.contains(
        "dark"
    );

localStorage.setItem(
    "prasun-ai-theme",
    isDark
        ? "dark"
        : "light"
);
```

}

if (themeButton) {

```
themeButton.addEventListener(
    "click",
    toggleTheme
);
```

}

applySavedTheme();

/* =========================================================
CHAT SEARCH
========================================================= */

if (chatSearch) {

```
chatSearch.addEventListener(
    "input",
    () => {

        const search =
            chatSearch.value
                .trim()
                .toLowerCase();

        historyItems.forEach(
            (item) => {

                const text =
                    item.textContent
                        .toLowerCase();

                if (
                    !search ||
                    text.includes(search)
                ) {

                    item.style.display =
                        "block";

                } else {

                    item.style.display =
                        "none";

                }

            }
        );

    }
);
```

}

/* =========================================================
HISTORY ITEMS
========================================================= */

historyItems.forEach(
(item) => {

```
    item.addEventListener(
        "click",
        () => {

            historyItems.forEach(
                (historyItem) => {

                    historyItem.classList.remove(
                        "active"
                    );

                }
            );

            item.classList.add(
                "active"
            );

            closeSidebar();

        }
    );

}
```

);

/* =========================================================
KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
"keydown",
(event) => {

```
    if (
        (event.metaKey ||
         event.ctrlKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        if (chatSearch) {

            chatSearch.focus();

        }

    }

}
```

);

/* =========================================================
INITIALIZE
========================================================= */

updateSendButton();

console.log(
"Prasun AI frontend initialized."
);
