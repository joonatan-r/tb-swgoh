
const { contextBridge, ipcRenderer } = require('electron');

let ready = false;
let lastHandledMsgId = null;

setInterval(() => {
    if (!ready) {
        ready = document.querySelector('[class^="titleWrapper"]')?.firstChild?.innerHTML?.endsWith('requests');
        if (!ready) {
            return;
        }
    }
    const msgs = document.querySelectorAll('[id^="chat-messages"]');
    const lastMsg = msgs[msgs.length - 1];
    if (lastHandledMsgId === null && lastMsg) {
        console.log(`initializing latest message to "${lastMsg.id}"`);
        lastHandledMsgId = lastMsg.id;
        return;
    }
    if (lastMsg && lastMsg.id !== lastHandledMsgId) {
        const regexp = /messageContent.*?<span>(.*?)<\/span>/g;
        const matches = lastMsg.innerHTML.replace(/\r?\n|\r/g, '').matchAll(regexp);
        const request = matches.next()?.value?.[1];
        if (request) {
            console.log(request);
            ipcRenderer.invoke('msg-request', request);
        }
        lastHandledMsgId = lastMsg.id;
    }
}, 10000);

const channels = ['msg-request'];
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
