/* =========================================================
PRASUN AI
Frontend Application
Real Gemini AI Connection
========================================================= */

"use strict";

/* =========================================================
CONFIGURATION
========================================================= */

const API_URL =
"https://prasun-ai-api.prasun301.workers.dev/";

/* =========================================================
ELEMENTS
========================================================= */

const sidebar =
document.getElementById("sidebar");

const sidebarOverlay =
document.getElementById("sidebarOverlay");

const openSidebarButton =
document.getElementById("openSidebar");

const closeSidebarButton =
document.getElementById("closeSidebar");

const newChatButton =
document.getElementById("newChatButton");

const messageInput =
document.getElementById("messageInput");

const sendButton =
document.getElementById("sendButton");

const messagesContainer =
document.getElementById("messages");

const welcomeScreen =
document.getElementById("welcomeScreen");

const themeButton =
document.getElementById("themeButton");

const chatSearch =
document.getElementById("chatSearch");

const suggestionCards =
document.querySelectorAll(".suggestion-card");

const historyItems =
document.querySelectorAll(".history-item");

/* =========================================================
CHAT HISTORY
========================================================= */

let conversationHistory = [];

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
CREATE USER MESSAGE
========================================================= */

function createUserMessage(text) {

```
if (!messagesContainer) return;

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

/* =========================================================
CREATE AI MESSAGE
========================================================= */

function createAIMessage(text) {

```
if (!messagesContainer) return;

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
CREATE THINKING MESSAGE
========================================================= */

function createThinkingMessage() {

```
if (!messagesContainer) {
    return null;
}

const message =
    document.createElement("div");

message.className =
    "message ai thinking-message";

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
    "Thinking...";

message.appendChild(avatar);

message.appendChild(content);

messagesContainer.appendChild(message);

scrollToBottom();

return message;
```

}

/* =========================================================
REAL GEMINI AI
========================================================= */

async function getAIResponse(userText) {

```
const response =
    await fetch(
        API_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                message:
                    userText,

                history:
                    conversationHistory

            })
        }
    );


let data;

try {

    data =
        await response.json();

} catch (error) {

    throw new Error(
        "The AI server returned an invalid response."
    );
}


if (!response.ok) {

    throw new Error(
        data &&
        data.error
            ? data.error
            : "AI request failed."
    );
}


if (
    !data ||
    typeof data.answer !== "string"
) {

    throw new Error(
        "The AI returned an invalid answer."
    );
}


return data.answer.trim();
```

}

/* =========================================================
SEND MESSAGE
========================================================= */

async function sendMessage() {

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

messageInput.value =
    "";

messageInput.style.height =
    "auto";

updateSendButton();


/* Scroll */

scrollToBottom();


/* Show thinking */

const thinkingMessage =
    createThinkingMessage();


/* Disable send button */

if (sendButton) {

    sendButton.disabled =
        true;

    sendButton.classList.add(
        "loading"
    );
}


try {

    /* Ask Gemini through Cloudflare */

    const answer =
        await getAIResponse(text);


    /* Remove thinking message */

    if (thinkingMessage) {

        thinkingMessage.remove();
    }


    /* Add AI response */

    createAIMessage(answer);


    /* Save conversation */

    conversationHistory.push({

        role: "user",

        text: text

    });


    conversationHistory.push({

        role: "model",

        text: answer

    });


    /* Keep history manageable */

    if (
        conversationHistory.length >
        40
    ) {

        conversationHistory =
            conversationHistory.slice(
                -40
            );
    }


} catch (error) {

    console.error(
        "Prasun AI error:",
        error
    );


    /* Remove thinking message */

    if (thinkingMessage) {

        thinkingMessage.remove();
    }


    createAIMessage(
        "Sorry, I couldn't connect to Prasun AI right now.\n\n" +
        "Please try again in a moment."
    );

} finally {

    if (sendButton) {

        sendButton.classList.remove(
            "loading"
        );
    }

    updateSendButton();

    scrollToBottom();
}
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

        if (messagesContainer) {

            messagesContainer.innerHTML =
                "";
        }


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


        conversationHistory =
            [];


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

            if (!messageInput) {
                return;
            }


            const prompt =
                card.dataset.prompt;


            if (!prompt) {
                return;
            }


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
