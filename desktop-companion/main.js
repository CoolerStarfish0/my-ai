const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require("electron");
const path = require("node:path");

const BRIDGE_ORIGIN = "http://127.0.0.1:3000";
let selectedSourceId = null;
let mainWindow = null;

function timeoutSignal(ms) {
  return AbortSignal.timeout(ms);
}

async function getScreenSources() {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 320, height: 200 },
    fetchWindowIcons: false
  });

  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail?.toDataURL?.() || ""
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 760,
    minWidth: 720,
    minHeight: 620,
    title: "Axon Desktop Companion",
    backgroundColor: "#10131a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const trustedAppPage = String(details?.requestingUrl || webContents?.getURL?.() || "").startsWith("file://");
    if (!trustedAppPage) {
      callback(false);
      return;
    }
    if (permission === "media") {
      const mediaTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : [];
      callback(mediaTypes.includes("audio"));
      return;
    }
    callback(permission === "display-capture");
  });

  // The renderer must explicitly select a source first. No source is captured on startup.
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    if (!selectedSourceId) {
      callback({});
      return;
    }

    try {
      const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
      const source = sources.find(item => item.id === selectedSourceId);
      selectedSourceId = null;
      callback(source ? { video: source, audio: undefined } : {});
    } catch {
      selectedSourceId = null;
      callback({});
    }
  });

  ipcMain.handle("axon:list-screens", async () => getScreenSources());

  ipcMain.handle("axon:select-screen", async (_event, sourceId) => {
    if (typeof sourceId !== "string" || sourceId.length > 300) {
      throw new Error("Invalid screen selection.");
    }
    const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
    if (!sources.some(source => source.id === sourceId)) {
      throw new Error("That screen is no longer available. Refresh the screen list.");
    }
    selectedSourceId = sourceId;
    return true;
  });

  ipcMain.handle("axon:bridge-health", async () => {
    try {
      const response = await fetch(`${BRIDGE_ORIGIN}/health`, {
        method: "GET",
        cache: "no-store",
        signal: timeoutSignal(5000)
      });
      const body = await response.text();
      return { ok: response.ok, status: response.status, body: body.slice(0, 1200) };
    } catch (error) {
      return { ok: false, error: error.message || "Local AI bridge is unavailable." };
    }
  });

  ipcMain.handle("axon:ask-local", async (_event, payload) => {
    if (!payload || typeof payload !== "object") throw new Error("Invalid Axon request.");

    const secret = typeof payload.secret === "string" ? payload.secret.trim() : "";
    const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
    const system = typeof payload.system === "string" ? payload.system.slice(0, 6000) : "";
    const images = Array.isArray(payload.images) ? payload.images : [];

    if (!secret || secret.length > 500) throw new Error("Enter your local AI bridge secret first.");
    if (!prompt || prompt.length > 4000) throw new Error("The prompt is empty or too long.");
    if (images.length > 1) throw new Error("Only one live screen frame can be sent at a time.");

    const safeImages = images.map(image => {
      if (!image || image.mimeType !== "image/jpeg" || typeof image.data !== "string" ||
          image.data.length > 560000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
        throw new Error("The screen frame is invalid or too large.");
      }
      return { mimeType: "image/jpeg", data: image.data };
    });

    const response = await fetch(`${BRIDGE_ORIGIN}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`
      },
      body: JSON.stringify({
        prompt,
        system,
        ...(safeImages.length ? { images: safeImages } : {})
      }),
      signal: timeoutSignal(90000)
    });

    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch {
      throw new Error(`Local AI returned a non-JSON response (HTTP ${response.status}). Check the bridge endpoint.`);
    }

    if (!response.ok) {
      throw new Error(typeof data.error === "string" ? data.error : `Local AI request failed (HTTP ${response.status}).`);
    }
    if (typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("Local AI returned an empty answer.");
    }

    return {
      answer: data.answer.trim().slice(0, 4000),
      model: typeof data.model === "string" ? data.model : "local Ollama"
    };
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
