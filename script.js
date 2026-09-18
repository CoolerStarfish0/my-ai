```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>5158 AI</title>
    <link rel="stylesheet" href="style.css">

    <!-- Firebase -->
    <script type="module" src="script.js"></script>
</head>

<body>

    <div class="app">

        <header>
            <div>
                <h1>5158 AI</h1>
                <p>My AI • My Memory</p>
            </div>

            <button id="loginButton">Sign in with Google</button>
        </header>

        <main>

            <div id="userInfo" class="user-info hidden">
                <span id="userName"></span>
                <button id="logoutButton">Log out</button>
            </div>

            <div id="chat" class="chat">
                <div class="message ai">
                    <div class="bubble">
                        Hello! Sign in with Google to start.
                        <br><br>
                        Anything you teach me ending in <b>5158</b> can be saved to your personal memory.
                    </div>
                </div>
            </div>

            <div class="input-area">
                <textarea
                    id="messageInput"
                    placeholder="Talk to your AI..."
                    rows="2"
                ></textarea>

                <button id="sendButton">Send</button>
            </div>

            <p class="hint">
                Example: "My favorite game is Geometry Dash 5158"
            </p>

        </main>

    </div>

</body>
</html>
```
