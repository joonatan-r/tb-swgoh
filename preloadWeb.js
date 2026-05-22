
const { ipcRenderer } = require('electron');

let ready = false;
let msgContainer = null;
let lastHandledMsgId = null;

const checkMsgs = () => {
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
};

(function handle() {
    if (!ready) {
        ready = document.querySelector('[class^="titleWrapper"]')?.firstChild?.innerHTML?.endsWith('requests');
        msgContainer = document.querySelector('[data-list-id^="chat-messages"]');
        ready = ready && msgContainer !== null;
        if (!ready) {
            setTimeout(handle, 1000);
            return;
        }
    }
    checkMsgs();
    new MutationObserver(
        (mutations) => mutations.forEach(mutation => mutation.type === 'childList' && checkMsgs())
    ).observe(msgContainer, { attributes: false, childList: true, subtree: true });
})();
