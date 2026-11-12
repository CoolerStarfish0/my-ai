const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("axonDesktop", {
  listScreens: () => ipcRenderer.invoke("axon:list-screens"),
  selectScreen: sourceId => ipcRenderer.invoke("axon:select-screen", sourceId),
  checkBridge: () => ipcRenderer.invoke("axon:bridge-health"),
  askLocal: payload => ipcRenderer.invoke("axon:ask-local", payload)
});
