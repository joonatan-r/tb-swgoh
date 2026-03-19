
const { app, BrowserWindow, ipcMain } = require('electron');
const { decode } = require('html-entities');
const path = require('node:path');
const fs = require('fs');
const getPlayersAndGps = require('./get-players');
const getGuildPage = require('./guild-page-finder');
const configFile = path.join(__dirname, 'config.txt')

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
    win.webContents.openDevTools();
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

ipcMain.handle('get-player-urls-and-names', async (event, url) => {
  return await fetch('https://swgoh.gg' + url).then(r => r.text()).then(getPlayerUrlsAndNames);
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

ipcMain.handle('get-players', async (event, url) => {
  return await getPlayersAndGps(url);
});

let guildSearchRunning = false;
let shouldStopGuildSearch = false;

ipcMain.handle('get-guild-page', async (event, searchStr) => {
  let idx = 1;
  let found = false;
  let info = undefined;
  
  while (/* !found && */ idx < 420) {
      guildSearchRunning = true;
      [found, info] = await getGuildPage(idx++, searchStr);
      if (shouldStopGuildSearch) {
        shouldStopGuildSearch = false;
        break;
      }
      if (info) event.sender.send('guild-found', info);
  }
  guildSearchRunning = false;
  event.sender.send('guild-search-end');
});

ipcMain.handle('guild-search-stop', () => {
  if (guildSearchRunning) {
    shouldStopGuildSearch = true;
  }
});

ipcMain.handle('get-config', () => {
  try {
    return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf-8' })?.trim());
  } catch (e) {
    return null;
  }
});

ipcMain.handle('write-config', (event, config) => {
  try {
    fs.writeFileSync(configFile, JSON.stringify(config), { encoding: 'utf-8' });
  } catch (e) {}
});
