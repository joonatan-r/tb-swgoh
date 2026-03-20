
const { app, BrowserWindow, ipcMain } = require('electron');
const { decode } = require('html-entities');
const path = require('node:path');
const fs = require('fs');

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });
    win.maximize();
    win.show();
    win.loadFile('client/index.html');
    // win.webContents.openDevTools();
};

app.whenReady().then(() => {
    createWindow();
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

function getPlayerUrlsAndNames(guildPageContent) {
    const regexp = /<a href="(\/p\/[0-9]*\/)">.*?font-bold.*?>(.*?)</g;
    const matches = guildPageContent.replace(/\r?\n|\r/g, '').matchAll(regexp);
    const urlsAndNames = [];
    for (const match of matches) {
        urlsAndNames.push({
            url: match[1].trim(),
            name: decode(match[2]).trim()
        });
    }
    return urlsAndNames;
}

function getRelicCharacters(playerCharactersContent) {
    const regexp = /unit-card__primary.*?relic-badge.*?<text.*?>([0-9]*)<.*?unit-card__name".*?>(.*?)<\//g;
    const matches = playerCharactersContent.replace(/\r?\n|\r/g, '').matchAll(regexp);
    const relicsAndNames = [];

    for (const match of matches) {
        relicsAndNames.push({
            relic: match[1].trim(),
            name: decode(match[2]).trim()
        });
    }
    return relicsAndNames;
}

function get7StarShips(playerShipsContent) {
    const regexp = /unit-card__primary(.*?)unit-card__name".*?>(.*?)<\//g;
    const matches = playerShipsContent.replace(/\r?\n|\r/g, '').matchAll(regexp);
    const names = [];

    for (const match of matches) {
        const inactiveStarsLength = (match[1].match(/rarity-range__star--inactive/g) || []).length;
        if (inactiveStarsLength === 0) {
            names.push(decode(match[2]).trim());
        }
    }
    return names;
}

let config;

try {
  config = JSON.parse(fs.readFileSync('data/config.json', { encoding: 'utf-8' }));
} catch (e) {
  console.error(e);
}

ipcMain.handle('get-player-urls-and-names', async () => {
  return await fetch('https://swgoh.gg' + config?.guildUrl).then(r => r.text()).then(getPlayerUrlsAndNames);
});

ipcMain.handle('get-relic-characters', async (event, url) => {
  return await fetch('https://swgoh.gg' + url).then(r => r.text()).then(getRelicCharacters);
});

ipcMain.handle('get-7-start-ships', async (event, url) => {
  return await fetch('https://swgoh.gg' + url).then(r => r.text()).then(get7StarShips);
});

const csvData = fs.readFileSync('data/rote.tsv', { encoding: 'utf-8' });
const data = {};

for (const csvRow of csvData.split('\r\n').slice(1)) {
  const cells = csvRow.split('\t');
  const planet = cells[2];
  const operation = cells[3];
  // const row = cells[4];
  // const slot = cells[5];
  const name = cells[6];
  if (!data[planet]) {
    data[planet] = {};
  }
  if (!data[planet][operation]) {
    data[planet][operation] = {};
  }
  if (!data[planet][operation][name]) {
    data[planet][operation][name] = {};
  }
  if (!data[planet][operation][name].total) {
    data[planet][operation][name].total = 0;
  }
  data[planet][operation][name].total++;
}

ipcMain.handle('get-data', async (event) => {
  return data;
});
