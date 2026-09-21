import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ==============================
// FIREBASE CONFIG
// ==============================

const firebaseConfig = {
    apiKey: "AIzaSyBVnqD6sw9KTthjB8ZaSHFFC8cn5Hyxn_U",
    authDomain: "ai-ef2a5.firebaseapp.com",
    projectId: "ai-ef2a5",
    storageBucket: "ai-ef2a5.firebasestorage.app",
    messagingSenderId: "573112672263",
    appId: "1:573112672263:web:df128e854e3fcca7950aa2"
};

// ==============================
// FIREBASE INITIALIZATION
// ==============================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// ==============================
// UI ELEMENTS
// ==============================

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// ==============================
// LOGIN
// ==============================

loginButton.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login error:", error);

        addMessage(
            "AI",
            "I couldn't sign you in. Check your Firebase settings."
        );
    }
});

// ==============================
// LOGOUT
// ==============================

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
});

// ==============================
// AUTH STATE
// ==============================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginButton.classList.add("hidden");
        userInfo.classList.remove("hidden");

        userName.textContent =
            `Logged in as ${user.displayName || user.email}`;

        clearChat();

        await loadMemory();

        addMessage(
            "AI",
            `Welcome ${user.displayName || ""}! 🧠\n\nI'm ready to learn. Teach me something by ending your message with 5158.`
        );
    } else {
        loginButton.classList.remove("hidden");
        userInfo.classList.add("hidden");
        userName.textContent = "";

        clearChat();
    }
});

// ==============================
// SEND MESSAGE
// ==============================

sendButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const user = auth.currentUser;

    if (!user) {
        addMessage(
            "AI",
            "Please sign in with Google first."
        );
        return;
    }

    const originalMessage = messageInput.value.trim();

    if (!originalMessage) {
        return;
    }

    messageInput.value = "";

    addMessage("USER", originalMessage);

    // ==============================
    // TEACHING MODE
    // ==============================

    if (originalMessage.endsWith("5158")) {
        const knowledge =
            originalMessage
                .slice(0, -4)
                .trim();

        if (!knowledge) {
            addMessage(
                "AI",
                "You used 5158, but there was nothing for me to learn."
            );
            return;
        }

        try {
            await saveMemory(
                user.uid,
                knowledge
            );

            addMessage(
                "AI",
                "Got it. I've learned that. 🧠📚"
            );
        } catch (error) {
            console.error(
                "Save knowledge error:",
                error
            );

            addMessage(
                "AI",
                "I understood what you wanted to teach me, but I couldn't save it. 😭"
            );
        }

        return;
    }

    // ==============================
    // LOAD TAUGHT KNOWLEDGE
    // ==============================

    let memories = [];

    try {
        memories =
            await getAllMemories(user.uid);

        console.log(
            "Loaded taught knowledge:",
            memories
        );
    } catch (error) {
        console.error(
            "Memory loading error:",
            error
        );

        addMessage(
            "AI",
            "I couldn't access my learned knowledge right now. 😭"
        );

        return;
    }

    // ==============================
    // ASK 5158 LOCAL AI
    // ==============================

    try {
        addMessage(
            "AI",
            "Thinking... 🧠"
        );

        const systemPrompt = `
You are 5158, a personal AI.

Your factual knowledge must come ONLY from the user's taught knowledge below.

If the taught knowledge does not contain enough information to answer a factual question, say:
"I don't know yet."

Do not invent facts or pretend you learned something that was not provided.

You can still understand normal language and have conversations naturally.

USER TAUGHT KNOWLEDGE:
${memories.length > 0
    ? memories.map(
        (memory, index) =>
            `${index + 1}. ${memory}`
      ).join("\n")
    : "No knowledge has been taught yet."
}
`;

        const response = await fetch(
            "https://5158-ai-backendpriv.vercel.app/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: originalMessage,
                    system: systemPrompt
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "Backend error FULL:",
                JSON.stringify(data, null, 2)
            );

            addMessage(
                "AI",
                "Sorry, I couldn't connect to my AI brain right now. 😭"
            );

            return;
        }

        addMessage(
            "AI",
            data.answer || "I don't know yet."
        );

        console.log(
            "5158 used model:",
            data.model
        );

        console.log(
            "AI source:",
            data.source
        );

    } catch (error) {
        console.error(
            "Connection error:",
            error
        );

        addMessage(
            "AI",
            "I couldn't reach the AI server. Check the backend connection. 😭"
        );
    }
}

// ==============================
// SAVE KNOWLEDGE
// ==============================

async function saveMemory(userId, text) {
    const memoriesRef =
        collection(
            db,
            "users",
            userId,
            "memories"
        );

    await addDoc(
        memoriesRef,
        {
            text: text,
            createdAt: serverTimestamp()
        }
    );
}

// ==============================
// LOAD KNOWLEDGE
// ==============================

async function loadMemory() {
    const user = auth.currentUser;

    if (!user) {
        return [];
    }

    try {
        const memories =
            await getAllMemories(user.uid);

        console.log(
            "Loaded taught knowledge:",
            memories
        );

        return memories;
    } catch (error) {
        console.error(
            "Could not load taught knowledge:",
            error
        );

        return [];
    }
}

// ==============================
// GET ALL TAUGHT KNOWLEDGE
// ==============================

async function getAllMemories(userId) {
    const memoriesRef =
        collection(
            db,
            "users",
            userId,
            "memories"
        );

    const snapshot =
        await getDocs(memoriesRef);

    return snapshot.docs
        .map(doc => doc.data().text)
        .filter(
            text =>
                typeof text === "string" &&
                text.trim() !== ""
        );
}

// ==============================
// ADD MESSAGE TO CHAT
// ==============================

function addMessage(sender, text) {
    const wrapper =
        document.createElement("div");

    wrapper.className =
        sender === "USER"
            ? "message user"
            : "message ai";

    const bubble =
        document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent = text;

    wrapper.appendChild(bubble);

    chat.appendChild(wrapper);

    chat.scrollTop =
        chat.scrollHeight;
}

// ==============================
// CLEAR CHAT
// ==============================

function clearChat() {
    chat.innerHTML = "";
}
