
const { contextBridge, ipcRenderer } = require('electron');

// window.addEventListener('DOMContentLoaded', () => {
//     const replaceText = (selector, text) => {
//       const element = document.getElementById(selector)
//       if (element) element.innerText = text
//     }
  
//     for (const dependency of ['chrome', 'node', 'electron']) {
//       replaceText(`${dependency}-version`, process.versions[dependency])
//     }
// });

const channels =
    [
        "get-players",
        "get-guild-page",
        "guild-search-stop",
        "get-config",
        "write-config",
        "get-player-urls-and-names",
        "get-relic-characters",
        "get-7-start-ships"
    ];
const events = ["guild-found", "guild-search-end"];
const callBacksForEvent = {};

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, ...data) => {
            if (channels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...data);
            }
        },
        on: (event, callback, clearOnEnd) => {
            if (events.includes(event)) {
                if (clearOnEnd) {
                    if (!callBacksForEvent[event]) callBacksForEvent[event] = [];
                    callBacksForEvent[event].push(callback);
                }
                return ipcRenderer.on(event, callback); 
            }
        },
        once: (event, callback) => {
            if (events.includes(event)) {
                return ipcRenderer.once(event, callback);
            }
        },
        off: (event, callback) => {
            if (events.includes(event)) {
                return ipcRenderer.off(event, callback);
            }
        }
    }
);

ipcRenderer.on("guild-search-end", () => {
    for (const callback of (callBacksForEvent["guild-found"] || [])) {
        ipcRenderer.off("guild-found", callback);
    }
    callBacksForEvent["guild-found"] = [];
});
