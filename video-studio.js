const MAX_VIDEO_FILES = 8;
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const PROJECT_KEY = "axon_video_studio_project_v1";

export function initVideoStudio({ requestEditPlan } = {}) {
  const openButton = document.getElementById("videoStudioButton");
  const studio = document.getElementById("videoStudio");
  if (!openButton || !studio) return;

  const closeButton = document.getElementById("videoStudioClose");
  const fileInput = document.getElementById("videoStudioFiles");
  const importButton = document.getElementById("videoStudioImport");
  const fileList = document.getElementById("videoStudioMedia");
  const timeline = document.getElementById("videoStudioTimeline");
  const preview = document.getElementById("videoStudioPreview");
  const canvas = document.getElementById("videoStudioCanvas");
  const status = document.getElementById("videoStudioStatus");
  const instruction = document.getElementById("videoStudioPrompt");
  const aiButton = document.getElementById("videoStudioAI");
  const exportButton = document.getElementById("videoStudioExport");
  const projectName = document.getElementById("videoStudioProjectName");
  const ctx = canvas.getContext("2d");
  const state = { assets: [], clips: [], activeClipId: null, busy: false, urls: new Set() };

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function makeId() { return "clip_" + Math.random().toString(36).slice(2, 10); }
  function activeClip() { return state.clips.find(item => item.id === state.activeClipId) || state.clips[0] || null; }
  function assetFor(clip) { return state.assets.find(item => item.id === clip.assetId) || null; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }

  function addFiles(files) {
    const incoming = Array.from(files || []);
    for (const file of incoming) {
      if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) continue;
      if (file.size > MAX_FILE_BYTES) { setStatus(file.name + " is larger than 2 GB and was skipped.", "error"); continue; }
      if (state.assets.length >= MAX_VIDEO_FILES) { setStatus("The project supports up to 8 source files for now.", "error"); break; }
      const url = URL.createObjectURL(file);
      state.urls.add(url);
      const asset = { id: makeId(), file, url, name: file.name, type: file.type, duration: 0 };
      state.assets.push(asset);
      if (file.type.startsWith("video/")) {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
          asset.duration = Number.isFinite(probe.duration) ? probe.duration : 0;
          if (!state.clips.some(clip => clip.assetId === asset.id)) {
            state.clips.push({ id: makeId(), assetId: asset.id, start: 0, end: asset.duration, timelineStart: 0 });
            state.activeClipId = state.clips[0].id;
          }
          render();
        };
        probe.onerror = () => setStatus("Could not read " + asset.name + ". Try MP4, WebM, or another browser-supported format.", "error");
        probe.src = url;
      }
    }
    render();
  }

  function renderMedia() {
    fileList.replaceChildren();
    if (!state.assets.length) {
      const empty = document.createElement("p"); empty.className = "vs-empty"; empty.textContent = "Import video or audio files to get started."; fileList.append(empty); return;
    }
    for (const asset of state.assets) {
      const row = document.createElement("div"); row.className = "vs-media-item";
      const label = document.createElement("span"); label.textContent = asset.name;
      const meta = document.createElement("small"); meta.textContent = asset.type.startsWith("video/") ? (asset.duration ? asset.duration.toFixed(1) + " sec" : "Reading…") : "Audio";
      row.append(label, meta); fileList.append(row);
    }
  }

  function renderTimeline() {
    timeline.replaceChildren();
    if (!state.clips.length) {
      const empty = document.createElement("p"); empty.className = "vs-empty"; empty.textContent = "Your video clips will appear here."; timeline.append(empty); return;
    }
    state.clips.forEach((clip, index) => {
      const asset = assetFor(clip); if (!asset) return;
      const row = document.createElement("article"); row.className = "vs-clip" + (clip.id === state.activeClipId ? " is-active" : "");
      const top = document.createElement("div"); top.className = "vs-clip-top";
      const name = document.createElement("strong"); name.textContent = (index + 1) + ". " + asset.name;
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.addEventListener("click", () => { state.clips = state.clips.filter(item => item.id !== clip.id); if (state.activeClipId === clip.id) state.activeClipId = state.clips[0]?.id || null; render(); });
      top.append(name, remove);
      const controls = document.createElement("div"); controls.className = "vs-trim-controls";
      const startLabel = document.createElement("label"); startLabel.textContent = "In";
      const startInput = document.createElement("input"); startInput.type = "number"; startInput.min = "0"; startInput.max = String(asset.duration); startInput.step = "0.1"; startInput.value = clip.start.toFixed(1);
      const endLabel = document.createElement("label"); endLabel.textContent = "Out";
      const endInput = document.createElement("input"); endInput.type = "number"; endInput.min = "0"; endInput.max = String(asset.duration); endInput.step = "0.1"; endInput.value = clip.end.toFixed(1);
      startInput.addEventListener("change", () => { clip.start = clamp(startInput.value, 0, Math.max(0, clip.end - 0.1)); startInput.value = clip.start.toFixed(1); renderPreview(); });
      endInput.addEventListener("change", () => { clip.end = clamp(endInput.value, clip.start + 0.1, asset.duration || clip.end); endInput.value = clip.end.toFixed(1); renderPreview(); });
      const select = document.createElement("button"); select.type = "button"; select.textContent = "Preview"; select.addEventListener("click", () => { state.activeClipId = clip.id; render(); });
      controls.append(startLabel, startInput, endLabel, endInput, select); row.append(top, controls); timeline.append(row);
    });
  }

  function renderPreview() {
    const clip = activeClip(); const asset = clip && assetFor(clip);
    if (!asset || !asset.type.startsWith("video/")) {
      preview.removeAttribute("src"); preview.load(); ctx.clearRect(0, 0, canvas.width, canvas.height); return;
    }
    if (preview.dataset.assetId !== asset.id) {
      preview.dataset.assetId = asset.id; preview.src = asset.url; preview.load();
      preview.onloadedmetadata = () => { preview.currentTime = clamp(clip.start, 0, Math.max(0, preview.duration - 0.05)); };
    } else if (Number.isFinite(clip.start)) {
      try { if (Math.abs(preview.currentTime - clip.start) > 0.2 && preview.paused) preview.currentTime = clip.start; } catch {}
    }
  }

  // The visible preview is the native <video> element. The canvas is reserved
  // for export so ordinary playback does not pay the per-frame canvas cost.
  function drawPreview() {
    if (!preview.videoWidth) return;
    const ratio = Math.min(canvas.width / preview.videoWidth, canvas.height / preview.videoHeight);
    const width = preview.videoWidth * ratio, height = preview.videoHeight * ratio;
    ctx.fillStyle = "#08070d"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(preview, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }
  preview.addEventListener("timeupdate", () => {
    const clip = activeClip();
    if (clip && preview.currentTime >= clip.end) {
      preview.pause();
      try { preview.currentTime = clip.end; } catch {}
    }
  });
  preview.addEventListener("play", () => { const clip = activeClip(); if (clip && preview.currentTime < clip.start) preview.currentTime = clip.start; });

  function render() { renderMedia(); renderTimeline(); renderPreview(); }
  function projectData() {
    return {
      version: 1,
      name: projectName.value.trim() || "Untitled video",
      width: canvas.width,
      height: canvas.height,
      clips: state.clips.map(clip => ({ source: assetFor(clip)?.name || "", start: clip.start, end: clip.end, timelineStart: clip.timelineStart || 0 }))
    };
  }

  function saveProject() {
    try { localStorage.setItem(PROJECT_KEY, JSON.stringify(projectData())); setStatus("Project edit list saved in this browser. Source media stays local.", "success"); }
    catch { setStatus("Could not save project settings in browser storage.", "error"); }
  }

  async function createAiPlan() {
    if (!state.clips.length) { setStatus("Import at least one video first.", "error"); return; }
    if (typeof requestEditPlan !== "function") { setStatus("AI editing is not connected yet.", "error"); return; }
    if (state.busy) return;
    state.busy = true; aiButton.disabled = true; setStatus("Axon is planning your edit…");
    try {
      const sources = state.assets.filter(asset => asset.type.startsWith("video/")).map(asset => ({ name: asset.name, durationSeconds: asset.duration }));
      const prompt = [
        "Create an edit decision list for this browser video editor.",
        "Return ONLY valid JSON, no markdown, with schema:",
        '{"clips":[{"source":"exact source filename","start":0,"end":3.5,"timelineStart":0}],"notes":"short explanation"}.',
        "Use only the supplied source filenames and valid time ranges. Keep the edit practical and chronological. Do not invent footage or claim to have seen the video; you only have file names and durations. Select useful segments based on the user's editing direction, and state when visual analysis is unavailable.",
        "Source videos: " + JSON.stringify(sources),
        "User's editing direction: " + instruction.value.trim()
      ].join("\n\n");
      const answer = await requestEditPlan(prompt);
      const raw = String(answer || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      if (!Array.isArray(parsed.clips) || !parsed.clips.length) throw new Error("Axon returned no valid clips.");
      const planned = [];
      for (const item of parsed.clips.slice(0, 80)) {
        const asset = state.assets.find(entry => entry.name === item.source && entry.type.startsWith("video/"));
        if (!asset) continue;
        const start = clamp(item.start, 0, Math.max(0, asset.duration - 0.1));
        const end = clamp(item.end, start + 0.1, asset.duration);
        if (end <= start) continue;
        planned.push({ id: makeId(), assetId: asset.id, start, end, timelineStart: Math.max(0, Number(item.timelineStart) || 0) });
      }
      if (!planned.length) throw new Error("The edit plan did not reference any imported video files correctly.");
      state.clips = planned; state.activeClipId = planned[0].id; render();
      setStatus((parsed.notes ? parsed.notes + " " : "") + "AI edit plan applied. Review the cuts before exporting.", "success");
    } catch (error) { setStatus("AI edit plan failed: " + (error.message || "Unknown error"), "error"); }
    finally { state.busy = false; aiButton.disabled = false; }
  }

  async function exportWebM() {
    if (!state.clips.length) { setStatus("Add at least one video clip before exporting.", "error"); return; }
    if (!window.MediaRecorder || !canvas.captureStream) { setStatus("This browser does not support browser-based video export.", "error"); return; }
    const supported = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
    if (!supported) { setStatus("No supported WebM recording format was found in this browser.", "error"); return; }
    exportButton.disabled = true; aiButton.disabled = true; setStatus("Rendering video in your browser…");
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: supported });
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = () => reject(new Error("Browser video recording failed.")); });
    recorder.start(500);
    try {
      for (const clip of state.clips) {
        const asset = assetFor(clip); if (!asset) continue;
        preview.pause(); preview.src = asset.url; preview.dataset.assetId = asset.id; preview.load();
        await new Promise((resolve, reject) => { preview.onloadedmetadata = resolve; preview.onerror = () => reject(new Error("Could not decode " + asset.name)); });
        await new Promise(resolve => { if (preview.readyState >= 2) resolve(); else preview.onloadeddata = resolve; });
        preview.currentTime = clip.start;
        await new Promise(resolve => { preview.onseeked = resolve; });
        const duration = clip.end - clip.start;
        const startedAt = performance.now();
        await new Promise(resolve => {
          const draw = now => {
            drawPreview();
            if (now - startedAt >= duration * 1000) { preview.pause(); resolve(); return; }
            requestAnimationFrame(draw);
          };
          preview.play().then(() => requestAnimationFrame(draw)).catch(() => resolve());
        });
      }
      recorder.stop(); await stopped;
      const blob = new Blob(chunks, { type: supported });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = (projectName.value.trim() || "axon-video").replace(/[^a-z0-9-_]+/gi, "-") + ".webm"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      renderPreview();
      setStatus("Export complete. Downloaded a WebM video. Audio tracks and advanced effects are not included in this first browser renderer.", "success");
    } catch (error) {
      try { recorder.stop(); } catch {}
      renderPreview();
      setStatus("Export failed: " + (error.message || "Unknown error"), "error");
    } finally {
      stream.getTracks().forEach(track => track.stop()); exportButton.disabled = false; aiButton.disabled = false;
    }
  }

  openButton.addEventListener("click", () => { window.axonTrackFeatureUse?.("Video Studio"); studio.classList.remove("hidden"); studio.setAttribute("aria-hidden", "false"); document.body.classList.add("video-studio-open"); render(); });
  function close() { studio.classList.add("hidden"); studio.setAttribute("aria-hidden", "true"); document.body.classList.remove("video-studio-open"); preview.pause(); }
  closeButton?.addEventListener("click", close);
  studio.addEventListener("click", event => { if (event.target === studio) close(); });
  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
  aiButton.addEventListener("click", createAiPlan);
  exportButton.addEventListener("click", exportWebM);
  document.getElementById("videoStudioSave")?.addEventListener("click", saveProject);
  document.getElementById("videoStudioPlay")?.addEventListener("click", () => { const clip = activeClip(); if (!clip) return; if (preview.paused) { if (preview.currentTime < clip.start || preview.currentTime >= clip.end) preview.currentTime = clip.start; preview.play().catch(() => setStatus("Press play again to allow browser playback.")); } else preview.pause(); });
  window.addEventListener("beforeunload", () => { for (const url of state.urls) URL.revokeObjectURL(url); });
  render();
}
