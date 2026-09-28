
const { ipcRenderer } = require('electron');

let ready = false;

(function handle() {
    if (!ready) {
        ready = !!document.querySelector('[id^="swgohgg-root-app"]');
        if (!ready) {
            setTimeout(handle, 1000);
            return;
        }
    }
    ipcRenderer.invoke('receive-data', document.documentElement.innerHTML);
})();
