"use strict";

/* =========================================================
   PRASUN AI
   Frontend Application
   ========================================================= */

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_URL = "https://ai.prasunbarua.com";

const DEFAULT_MODEL = "gemini-3.6-flash";

let selectedModel = DEFAULT_MODEL;


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

let isSending = false;


/* =========================================================
   LOAD AVAILABLE MODELS
   ========================================================= */

async function loadModels() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/models`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.warn(
                "Could not load models:",
                data
            );

            selectedModel =
                DEFAULT_MODEL;

            return;

        }

        /*
         * Use the Worker-provided default model.
         */

        if (
            typeof data.defaultModel === "string" &&
            data.defaultModel.trim()
        ) {

            selectedModel =
                data.defaultModel.trim();

        } else {

            selectedModel =
                DEFAULT_MODEL;

        }

        /*
         * Make sure the selected model
         * is actually available.
         */

        if (
            Array.isArray(data.chatModels)
        ) {

            const available =
                data.chatModels.some(
                    function (model) {

                        return (
                            model.modelId ===
                            selectedModel
                        );

                    }
                );

            if (!available) {

                console.warn(
                    "Default model is not in available model list."
                );

                selectedModel =
                    DEFAULT_MODEL;

            }

        }

        console.log(
            "Prasun AI model:",
            selectedModel
        );

    } catch (error) {

        console.warn(
            "Model loading failed:",
            error
        );

        /*
         * Safe fallback.
         */

        selectedModel =
            DEFAULT_MODEL;
    }
}


/* =========================================================
   SIDEBAR
   ========================================================= */

function openSidebar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.add("open");

    if (sidebarOverlay) {

        sidebarOverlay.classList.add(
            "active"
        );

    }
}


function closeSidebar() {

    if (!sidebar) {
        return;
    }

    sidebar.classList.remove("open");

    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            "active"
        );

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

    if (!messageInput) {
        return;
    }

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

    if (!sendButton) {
        return;
    }

    const hasText =
        messageInput &&
        messageInput.value.trim().length > 0;

    const hasFile =
        selectedFile !== null;

    sendButton.disabled =
        (!hasText && !hasFile) ||
        isSending;
}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        function () {

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

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;

    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(2)} MB`;
}


function getFileIcon(file) {

    const type =
        (file.type || "")
            .toLowerCase();

    if (
        type.startsWith(
            "image/"
        )
    ) {

        return "🖼️";

    }

    if (
        type ===
        "application/pdf"
    ) {

        return "📄";

    }

    if (
        type.includes("text") ||
        type.includes("javascript") ||
        type.includes("json") ||
        type.includes("html")
    ) {

        return "💻";

    }

    return "📎";
}


function showAttachment(file) {

    selectedFile = file;

    if (attachmentName) {

        attachmentName.textContent =
            file.name;

    }

    if (attachmentSize) {

        attachmentSize.textContent =
            formatFileSize(
                file.size
            );

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

        fileInput.value =
            "";

    }

    if (attachmentPreview) {

        attachmentPreview.hidden =
            true;

    }

    updateSendButton();
}


/* Open file picker */

if (
    attachButton &&
    fileInput
) {

    attachButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            fileInput.click();

        }
    );

}


/* File selected */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        function () {

            const file =
                fileInput.files &&
                fileInput.files[0];

            if (!file) {
                return;
            }

            const maxSize =
                10 * 1024 * 1024;

            if (
                file.size >
                maxSize
            ) {

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


/* Remove file */

if (removeAttachment) {

    removeAttachment.addEventListener(
        "click",
        function () {

            clearAttachment();

        }
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


    /* File */

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


    /* Text */

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
   FILE TO BASE64
   ========================================================= */

function fileToBase64(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload =
                function () {

                    const result =
                        reader.result;

                    if (
                        typeof result !==
                        "string"
                    ) {

                        reject(
                            new Error(
                                "Could not read the file."
                            )
                        );

                        return;
                    }

                    const commaIndex =
                        result.indexOf(",");

                    if (
                        commaIndex === -1
                    ) {

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

            reader.onerror =
                function () {

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

    let fileData =
        null;


    /* Convert file */

    if (file) {

        const base64 =
            await fileToBase64(
                file
            );

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


    /*
     * IMPORTANT
     *
     * We explicitly send:
     *
     * gemini-3.6-flash
     *
     * This prevents an old frontend
     * model from being used.
     */

    const requestBody = {

        message:
            userText,

        model:
            selectedModel,

        history:
            conversationHistory,

        file:
            fileData

    };


    console.log(
        "Sending request:",
        requestBody
    );


    const response =
        await fetch(
            `${API_URL}/api/chat`,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        requestBody
                    )

            }
        );


    /* Read response */

    const rawText =
        await response.text();

    let data;

    try {

        data =
            rawText
                ? JSON.parse(
                    rawText
                )
                : {};

    } catch (error) {

        console.error(
            "Invalid JSON:",
            rawText
        );

        throw new Error(
            "The AI server returned an invalid response."
        );

    }


    console.log(
        "AI HTTP status:",
        response.status
    );

    console.log(
        "AI response:",
        data
    );


    /* Server error */

    if (!response.ok) {

        throw new Error(
            data &&
            data.error
                ? data.error
                : `AI request failed (${response.status}).`
        );

    }


    /*
     * Your Worker returns:
     *
     * response: "..."
     *
     * Older Worker versions may return:
     *
     * answer: "..."
     *
     * Support both.
     */

    const answer =
        typeof data.response ===
            "string"
            ? data.response
            : typeof data.answer ===
                "string"
                ? data.answer
                : "";


    if (!answer) {

        throw new Error(
            "The AI returned an empty or invalid answer."
        );

    }


    return answer.trim();
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (!messageInput) {
        return;
    }

    if (isSending) {
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


    /* Disable duplicate sending */

    isSending =
        true;

    updateSendButton();


    /* Hide welcome */

    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";

    }


    /* Display user message */

    createUserMessage(
        text,
        file
    );


    /* Clear composer */

    messageInput.value =
        "";

    messageInput.style.height =
        "auto";


    clearAttachment();

    scrollToBottom();


    /* Thinking */

    const thinkingMessage =
        createThinkingMessage();


    try {

        const answer =
            await getAIResponse(
                text,
                file
            );


        /* Remove thinking */

        if (thinkingMessage) {

            thinkingMessage.remove();

        }


        /* Display AI answer */

        createAIMessage(
            answer
        );


        /* Save history */

        conversationHistory.push({

            role:
                "user",

            text:
                text ||
                (
                    file
                        ? `[Uploaded file: ${file.name}]`
                        : ""
                )

        });


        conversationHistory.push({

            role:
                "assistant",

            text:
                answer

        });


        /* Keep latest 40 messages */

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


    isSending =
        false;

    updateSendButton();

    scrollToBottom();
}


/* =========================================================
   SEND BUTTON
   ========================================================= */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            sendMessage();

        }
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
             * Enter = send
             * Shift + Enter = new line
             */

            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {

                event.preventDefault();

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
        function () {

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
        function () {

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

            isSending =
                false;

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
    function (card) {

        card.addEventListener(
            "click",
            function () {

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
        function () {

            const search =
                chatSearch.value
                    .trim()
                    .toLowerCase();

            historyItems.forEach(
                function (item) {

                    const text =
                        item.textContent
                            .toLowerCase();

                    if (
                        !search ||
                        text.includes(
                            search
                        )
                    ) {

                        item.style.display =
                            "";

                    } else {

                        item.style.display =
                            "none";

                    }

                }
            );

        }
    );

}


/* =========================================================
   HISTORY ITEMS
   ========================================================= */

historyItems.forEach(
    function (item) {

        item.addEventListener(
            "click",
            function () {

                historyItems.forEach(
                    function (historyItem) {

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
    function (event) {

        if (
            (
                event.metaKey ||
                event.ctrlKey
            ) &&
            event.key.toLowerCase() ===
                "k"
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

async function initializePrasunAI() {

    updateSendButton();

    /*
     * Load model from Worker.
     */

    await loadModels();

    console.log(
        "Prasun AI frontend initialized successfully."
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "Model:",
        selectedModel
    );
}


initializePrasunAI();
