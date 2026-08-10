"use strict";

/* =========================================================
   PRASUN AI
   Frontend Application
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

const attachButton =
    document.getElementById("attachButton");

const fileInput =
    document.getElementById("fileInput");

const attachmentPreview =
    document.getElementById("attachmentPreview");

const attachmentName =
    document.getElementById("attachmentName");

const attachmentSize =
    document.getElementById("attachmentSize");

const attachmentIcon =
    document.getElementById("attachmentIcon");

const removeAttachment =
    document.getElementById("removeAttachment");

const suggestionCards =
    document.querySelectorAll(".suggestion-card");

const historyItems =
    document.querySelectorAll(".history-item");


/* =========================================================
   STATE
========================================================= */

let conversationHistory = [];

let selectedFile = null;


/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.add("active");
    }
}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("active");
    }
}


if (openSidebarButton) {
    openSidebarButton.addEventListener(
        "click",
        openSidebar
    );
}


if (closeSidebarButton) {
    closeSidebarButton.addEventListener(
        "click",
        closeSidebar
    );
}


if (sidebarOverlay) {
    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );
}


/* =========================================================
   TEXTAREA
========================================================= */

function resizeTextarea() {

    if (!messageInput) return;

    messageInput.style.height =
        "auto";

    const newHeight =
        Math.min(
            messageInput.scrollHeight,
            180
        );

    messageInput.style.height =
        `${newHeight}px`;
}


function updateSendButton() {

    if (!sendButton) return;

    const hasText =
        messageInput &&
        messageInput.value.trim().length > 0;

    const hasFile =
        selectedFile !== null;

    sendButton.disabled =
        !hasText && !hasFile;
}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        () => {

            resizeTextarea();
            updateSendButton();

        }
    );
}


/* =========================================================
   FILE UPLOAD
========================================================= */

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


function getFileIcon(file) {

    const type =
        file.type.toLowerCase();

    if (type.startsWith("image/")) {
        return "🖼️";
    }

    if (type === "application/pdf") {
        return "📄";
    }

    return "💻";
}


function showAttachment(file) {

    selectedFile = file;

    if (attachmentName) {
        attachmentName.textContent =
            file.name;
    }

    if (attachmentSize) {
        attachmentSize.textContent =
            formatFileSize(file.size);
    }

    if (attachmentIcon) {
        attachmentIcon.textContent =
            getFileIcon(file);
    }

    if (attachmentPreview) {
        attachmentPreview.hidden =
            false;
    }

    updateSendButton();
}


function clearAttachment() {

    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (attachmentPreview) {
        attachmentPreview.hidden =
            true;
    }

    updateSendButton();
}


if (attachButton && fileInput) {

    attachButton.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );
}


if (fileInput) {

    fileInput.addEventListener(
        "change",
        () => {

            const file =
                fileInput.files &&
                fileInput.files[0];

            if (!file) return;

            /*
             * Keep the first version conservative.
             * Large files can exceed API limits.
             */

            const maxSize =
                10 * 1024 * 1024;

            if (file.size > maxSize) {

                alert(
                    "Please choose a file smaller than 10 MB."
                );

                clearAttachment();

                return;
            }

            showAttachment(file);

        }
    );
}


if (removeAttachment) {

    removeAttachment.addEventListener(
        "click",
        clearAttachment
    );
}


/* =========================================================
   CREATE USER MESSAGE
========================================================= */

function createUserMessage(
    text,
    file = null
) {

    if (!messagesContainer) {
        return;
    }

    const message =
        document.createElement("div");

    message.className =
        "message user";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    if (file) {

        const fileLabel =
            document.createElement("div");

        fileLabel.className =
            "user-file";

        fileLabel.textContent =
            `📎 ${file.name}`;

        content.appendChild(
            fileLabel
        );
    }


    if (text) {

        const textElement =
            document.createElement("div");

        textElement.textContent =
            text;

        content.appendChild(
            textElement
        );
    }


    message.appendChild(
        content
    );

    messagesContainer.appendChild(
        message
    );
}


/* =========================================================
   CREATE AI MESSAGE
========================================================= */

function createAIMessage(text) {

    if (!messagesContainer) {
        return;
    }

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


    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );

    messagesContainer.appendChild(
        message
    );
}


/* =========================================================
   THINKING MESSAGE
========================================================= */

function createThinkingMessage() {

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


    message.appendChild(
        avatar
    );

    message.appendChild(
        content
    );

    messagesContainer.appendChild(
        message
    );

    scrollToBottom();

    return message;
}


/* =========================================================
   CONVERT FILE TO BASE64
========================================================= */

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {

                const result =
                    reader.result;

                const commaIndex =
                    result.indexOf(",");

                if (commaIndex === -1) {

                    reject(
                        new Error(
                            "Could not read the file."
                        )
                    );

                    return;
                }

                resolve(
                    result.substring(
                        commaIndex + 1
                    )
                );
            };


            reader.onerror = () => {

                reject(
                    new Error(
                        "Could not read the file."
                    )
                );
            };


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   SEND REQUEST TO WORKER
========================================================= */

async function getAIResponse(
    userText,
    file
) {

    let fileData = null;


    if (file) {

        const base64 =
            await fileToBase64(file);

        fileData = {

            name:
                file.name,

            type:
                file.type ||
                "application/octet-stream",

            data:
                base64

        };
    }


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
                        conversationHistory,

                    file:
                        fileData

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
}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const text =
        messageInput.value.trim();


    if (
        !text &&
        !selectedFile
    ) {
        return;
    }


    const file =
        selectedFile;


    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";
    }


    createUserMessage(
        text,
        file
    );


    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    clearAttachment();


    updateSendButton();

    scrollToBottom();


    const thinkingMessage =
        createThinkingMessage();


    try {

        const answer =
            await getAIResponse(
                text,
                file
            );


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        createAIMessage(
            answer
        );


        conversationHistory.push({

            role: "user",

            text:
                text ||
                `[Uploaded file: ${file.name}]`

        });


        conversationHistory.push({

            role: "model",

            text: answer

        });


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


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        createAIMessage(
            "Sorry, I couldn't process your request right now.\n\n" +
            error.message
        );

    }


    updateSendButton();

    scrollToBottom();
}


/* =========================================================
   SEND BUTTON
========================================================= */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================================================
   ENTER TO SEND
========================================================= */

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function (event) {

            /*
             * Enter = Send
             * Shift + Enter = New line
             */

            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {

                event.preventDefault();

                event.stopPropagation();

                sendMessage();

            }

        }
    );
}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom() {

    if (!messagesContainer) {
        return;
    }

    setTimeout(
        () => {

            messagesContainer.scrollTo({
                top:
                    messagesContainer.scrollHeight,

                behavior:
                    "smooth"
            });

        },
        50
    );
}


/* =========================================================
   NEW CHAT
========================================================= */

if (newChatButton) {

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


            clearAttachment();

            updateSendButton();

            closeSidebar();


            if (messageInput) {

                messageInput.focus();
            }

        }
    );
}


/* =========================================================
   SUGGESTIONS
========================================================= */

suggestionCards.forEach(
    (card) => {

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
);


/* =========================================================
   DARK / LIGHT MODE
========================================================= */

function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "prasun-ai-theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );
    }
}


function toggleTheme() {

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
}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        toggleTheme
    );
}


applySavedTheme();


/* =========================================================
   CHAT SEARCH
========================================================= */

if (chatSearch) {

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


                    item.style.display =
                        (
                            !search ||
                            text.includes(search)
                        )
                            ? "block"
                            : "none";

                }
            );

        }
    );
}


/* =========================================================
   HISTORY ITEMS
========================================================= */

historyItems.forEach(
    (item) => {

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
);


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

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
);


/* =========================================================
   INITIALIZE
========================================================= */

updateSendButton();

console.log(
    "Prasun AI frontend initialized."
);
