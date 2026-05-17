
const { ipcRenderer } = require('electron');

let ready = false;
let lastHandledMsgId = null;

(function handle() {
    setTimeout(handle, 10000);
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
})();
