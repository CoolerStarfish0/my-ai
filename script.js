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

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "ai-ef2a5.firebaseapp.com",
    projectId: "ai-ef2a5",
    storageBucket: "ai-ef2a5.firebasestorage.app",
    messagingSenderId: "573112672263",
    appId: "1:573112672263:web:df128e854e3fcca7950aa2"
};
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");_",
    authDomain: "ai-ef2a5.firebaseapp.com",
    projectId: "ai-ef2a5",
    storageBucket: "ai-ef2a5.firebasestorage.app",
    messagingSenderId: "573112672263",
    appId: "1:573112672263:web:df128e854e3fcca7950aa2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");: "ai-ef2a5.firebaseapp.com",
    projectId: "ai-ef2a5",
    storageBucket: "ai-ef2a5.firebasestorage.app",
    messagingSenderId: "573112672263",
    appId: "1:573112672263:web:df128e854e3fcca7950aa2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");",
    authDomain: "ai-ef2a5.firebaseapp.com",
    projectId: "ai-ef2a5",
    storageBucket: "ai-ef2a5.firebasestorage.app",
    messagingSenderId: "573112672263",
    appId: "1:573112672263:web:df128e854e3fcca7950aa2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userInfo = document.getElementById("userInfo");
const userName = document.getElementById("userName");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

loginButton.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error(error);
        addMessage("AI", "I couldn't sign you in. Check your Firebase settings.");
    }
});

logoutButton.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginButton.classList.add("hidden");
        userInfo.classList.remove("hidden");

        userName.textContent =
            `Logged in as ${user.displayName || user.email}`;

        clearChat();

        addMessage(
            "AI",
            `Welcome ${user.displayName || ""}! 🧠\n\nYour personal notebook is connected.`
        );

        await loadMemory();
    } else {
        loginButton.classList.remove("hidden");
        userInfo.classList.add("hidden");
        userName.textContent = "";
    }
});

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
        addMessage("AI", "Please sign in with Google first.");
        return;
    }

    const originalMessage = messageInput.value.trim();

    if (!originalMessage) return;

    messageInput.value = "";
    addMessage("USER", originalMessage);

    // If the user ends their message with 5158, save it as a memory
    if (originalMessage.endsWith("5158")) {
        const knowledge = originalMessage.slice(0, -4).trim();

        if (!knowledge) {
            addMessage("AI", "You used 5158, but there was nothing to learn.");
            return;
        }

        await saveMemory(user.uid, knowledge);

        addMessage(
            "AI",
            "Got it. I've saved that to your personal notebook. 🧠📓"
        );

        return;
    }

    // Find memories relevant to the user's message
    const memories =
        await findRelevantMemories(user.uid, originalMessage);

    // Send the message + memories to the Vercel backend
    try {
        addMessage("AI", "Thinking... 🧠");

        const response = await fetch(
            "https://5158-ai-backendpriv.vercel.app/api/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: originalMessage,
                    memories: memories
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Backend error:", data);
            addMessage(
                "AI",
                "Sorry, I couldn't connect to my AI brain right now. 😭"
            );
            return;
        }

        addMessage("AI", data.answer);

    } catch (error) {
        console.error("Connection error:", error);

        addMessage(
            "AI",
            "I couldn't reach the AI server. Check the backend connection. 😭"
        );
    }
}

async function saveMemory(userId, text) {
    const memoriesRef =
        collection(db, "users", userId, "memories");

    await addDoc(memoriesRef, {
        text: text,
        createdAt: serverTimestamp()
    });
}

async function loadMemory() {
    const user = auth.currentUser;

    if (!user) return;

    const memoriesRef =
        collection(db, "users", user.uid, "memories");

    const snapshot = await getDocs(memoriesRef);

    console.log(
        "Loaded memories:",
        snapshot.docs.map(doc => doc.data().text)
    );
}

async function findRelevantMemories(userId, question) {
    const memoriesRef =
        collection(db, "users", userId, "memories");

    const snapshot = await getDocs(memoriesRef);

    const memories =
        snapshot.docs.map(doc => doc.data().text);

    const words =
        normalise(question)
            .split(/\s+/)
            .filter(word => word.length > 2);

    const scored = memories.map(memory => {
        const memoryWords =
            normalise(memory).split(/\s+/);

        let score = 0;

        for (const word of words) {
            if (memoryWords.includes(word)) {
                score++;
            }
        }

        return {
            text: memory,
            score: score
        };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored
        .filter(item => item.score > 0)
        .slice(0, 5)
        .map(item => item.text);
}

function createBasicResponse(question, memories) {
    if (memories.length === 0) {
        return `I don't have anything in my notebook that seems relevant to that yet.

You can teach me something by ending your message with 5158.`;
    }

    return `I found this in your notebook:

${memories.map(x => "• " + x).join("\n")}

I can retrieve this information, but I don't have a full language model connected yet. That's the next part we'll add.`;
}
function normalise(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "");
}

function addMessage(sender, text) {
    const wrapper = document.createElement("div");

    wrapper.className =
        sender === "USER"
            ? "message user"
            : "message ai";

    const bubble = document.createElement("div");

    bubble.className = "bubble";
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    chat.scrollTop = chat.scrollHeight;
}

function clearChat() {
    chat.innerHTML = "";
}
