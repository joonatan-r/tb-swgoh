
const { decode } = require('html-entities');

let calculating = false;

const getRelicForPlanet = (planet) => {
    if (['Mustafar', 'Corellia', 'Coruscant'].includes(planet)) {
        return 5;
    }
    if (['Geonosis', 'Felucia', 'Bracca'].includes(planet)) {
        return 6;
    }
    if (['Dathomir', 'Tatooine', 'Zeffo', 'Kashyyyk'].includes(planet)) {
        return 7;
    }
    if (['Haven-class Medical Station', 'Mandalore', 'Kessel', 'Lothal'].includes(planet)) {
        return 8;
    }
    if (['Malachor', 'Vandor', 'Ring of Kafrene', 'Death Star', 'Hoth', 'Scarif'].includes(planet)) {
        return 9;
    }
};

const getTotalNeededInAllZones = (data, operations) => {
    const totalInAllZonesByUnit = {};
    for (const planet of Object.keys(data)) {
        for (const operation of Object.keys(data[planet])) {
            if (!operations[planet][operation]) {
                continue;
            }
            for (const name of Object.keys(data[planet][operation])) {
                if (!totalInAllZonesByUnit[name]) {
                    totalInAllZonesByUnit[name] = 0;
                }
                totalInAllZonesByUnit[name] += data[planet][operation][name].total;
            }
        }
    }
    return totalInAllZonesByUnit;
};

const operationsBase = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
};

const operationsAll = {
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true
};

const formatReportObject = (obj, hideIfOnlyOne) => {
    const objKeys = Object.keys(obj);
    if (!objKeys.length) {
        return '-\n';
    }
    if (hideIfOnlyOne && objKeys.length === 1) {
        console.log(`hid the only ${objKeys[0]} from "not all possible" report`);
        return '-\n';
    }
    return objKeys.map(key => `${key} (${obj[key].join(', ')})`).join(',\n') + '\n';
};

const getUpdatedReport = (result, operations) => {
    if (!result?.length) {
        return undefined;
    }
    const notPossible = {};
    const notAllPossible = {};
    const notAllPossibleAutoRemoved = {};
    const exactlyPossibleOneOp = {};
    const exactlyPossibleSeveralOps = {};
    const exactlyPossibleSeveralOpsAutoRemoved = {};
    const possibleWithLeftOver = [];
    const notPossibleOps = [];
    const resultCopy = JSON.parse(JSON.stringify(result)); // lazy way to copy
    for (const row of result) {
        if (!operations[row.planet][row.operation]) {
            continue;
        }
        if (Number(row.owned) < Number(row.total)) {
            if (!notPossible[`${row.planet} ${row.operation}`]) {
                notPossible[`${row.planet} ${row.operation}`] = [];
            }
            notPossible[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.total}`);
            notPossibleOps.push({ planet: row.planet, operation: row.operation });
        }
        if (Number(row.owned) < Number(row.totalAllZones)) {
            if (!notAllPossible[`${row.planet} ${row.operation}`]) {
                notAllPossible[`${row.planet} ${row.operation}`] = [];
            }
            notAllPossible[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
        }
        if (`${row.owned}` === `${row.total}`) {
            if (!exactlyPossibleOneOp[`${row.planet} ${row.operation}`]) {
                exactlyPossibleOneOp[`${row.planet} ${row.operation}`] = [];
            }
            exactlyPossibleOneOp[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.total}`);
        }
        if (`${row.owned}` === `${row.totalAllZones}`) {
            if (!exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`]) {
                exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`] = [];
            }
            exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
        }
    }
    const unitsToRemove = {};
    for (const notPossibleOp of notPossibleOps) {
        for (let i = resultCopy.length - 1; i >= 0; i--) {
            const row = resultCopy[i];
            if (!operations[row.planet][row.operation]) {
                continue;
            }
            if (notPossibleOp.planet === row.planet && notPossibleOp.operation === row.operation) {
                if (!unitsToRemove[row.name]) {
                    unitsToRemove[row.name] = 0;
                }
                unitsToRemove[row.name] += Number(row.total);
                resultCopy.splice(i, 1);
            }
        }
    }
    for (const unit of Object.keys(unitsToRemove)) {
        for (const row of resultCopy) {
            if (!operations[row.planet][row.operation]) {
                continue;
            }
            if (row.name === unit) {
                row.totalAllZones = Number(row.totalAllZones) - unitsToRemove[unit];
            }
        }
    }
    for (const row of resultCopy) {
        if (!operations[row.planet][row.operation]) {
            continue;
        }
        if (Number(row.owned) < Number(row.totalAllZones)) {
            if (!notAllPossibleAutoRemoved[`${row.planet} ${row.operation}`]) {
                notAllPossibleAutoRemoved[`${row.planet} ${row.operation}`] = [];
            }
            notAllPossibleAutoRemoved[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
        } else if (`${row.owned}` === `${row.totalAllZones}`) {
            if (!exactlyPossibleSeveralOpsAutoRemoved[`${row.planet} ${row.operation}`]) {
                exactlyPossibleSeveralOpsAutoRemoved[`${row.planet} ${row.operation}`] = [];
            }
            exactlyPossibleSeveralOpsAutoRemoved[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
        }
    }
    for (const row of result) {
        if (!operations[row.planet][row.operation]
            || possibleWithLeftOver.includes(`${row.planet} ${row.operation}`)
        ) {
            continue;
        }
        let notInOtherReports = true;
        for (const reportObject of [
            notPossible,
            notAllPossible,
            notAllPossibleAutoRemoved,
            exactlyPossibleOneOp,
            exactlyPossibleSeveralOps,
            exactlyPossibleSeveralOpsAutoRemoved
        ]) {
            if (Object.keys(reportObject).includes(`${row.planet} ${row.operation}`)) {
                notInOtherReports = false;
                break;
            }
        }
        if (notInOtherReports) {
            possibleWithLeftOver.push(`${row.planet} ${row.operation}`);
        }
    }
    for (const notPossibleOp of notPossibleOps) {
        let hidden = false;
        for (const reportObject of [
            notAllPossible,
            notAllPossibleAutoRemoved,
            exactlyPossibleOneOp,
            exactlyPossibleSeveralOps,
            exactlyPossibleSeveralOpsAutoRemoved
        ]) {
            if (reportObject[`${notPossibleOp.planet} ${notPossibleOp.operation}`]) {
                delete reportObject[`${notPossibleOp.planet} ${notPossibleOp.operation}`];
                hidden = true;
            }
        }
        if (hidden) {
            console.log(`hid not possible ${notPossibleOp.planet} ${notPossibleOp.operation} from other reports`);
        }
    }
    return `
Not possible:

${formatReportObject(notPossible)}

Not all possible (still counting units from not possible operations):

${formatReportObject(notAllPossible, true)}

Not all possible (assuming no units put to not possible operations):

${formatReportObject(notAllPossibleAutoRemoved, true)}

Exactly possible (considering one operation):

${formatReportObject(exactlyPossibleOneOp)}

Exactly possible (considering all operations, still counting units from not possible operations):

${formatReportObject(exactlyPossibleSeveralOps)}

Exactly possible (considering all operations, assuming no units put to not possible operations):

${formatReportObject(exactlyPossibleSeveralOpsAutoRemoved)}

Possible with left over:

${possibleWithLeftOver.length ? possibleWithLeftOver.join(',\n') : '-\n'}
`;
};

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

function getOpsFromRequest(request, operations) {
    const zones = request.split(',');
    for (const zone of zones) {
        const parts = zone.trim().split(' ');
        const name = parts[0];
        if (parts.some(p => p.toLowerCase() === 'all')) {
            operations[name] = { ...operationsAll };
        } else {
            for (let i = 1; i < parts.length; i++) {
                operations[name][parts[i]] = true;
            }
        }
    }
}

const send = (str) => {
    console.log(str)
};

const calculate = async (request, guildUrl, data) => {
    if (calculating) {
        return;
    }
    calculating = true;
    const urlsAndNames = await fetch('https://swgoh.gg' + guildUrl).then(r => r.text()).then(getPlayerUrlsAndNames);
    const rosters = [];
    for (const player of urlsAndNames) {
        console.log(player);
        const characters = await fetch('https://swgoh.gg' + player.url + 'characters/').then(r => r.text()).then(getRelicCharacters);
        const ships = await fetch('https://swgoh.gg' + player.url + 'ships/').then(r => r.text()).then(get7StarShips);
        rosters.push({
            player: player.name,
            characters,
            ships
        });
    }

    const operations = {
        Mustafar: { ...operationsBase },
        Corellia: { ...operationsBase },
        Coruscant: { ...operationsBase },
        Geonosis: { ...operationsBase },
        Felucia: { ...operationsBase },
        Bracca: { ...operationsBase },
        Dathomir: { ...operationsBase },
        Tatooine: { ...operationsBase },
        Zeffo: { ...operationsBase },
        Kashyyyk: { ...operationsBase },
        'Haven-class Medical Station': { ...operationsBase },
        Mandalore: { ...operationsBase },
        Kessel: { ...operationsBase },
        Lothal: { ...operationsBase },
        Malachor: { ...operationsBase },
        Vandor: { ...operationsBase },
        'Ring of Kafrene': { ...operationsBase },
        'Death Star': { ...operationsBase },
        Hoth: { ...operationsBase },
        Scarif: { ...operationsBase },
    };

    getOpsFromRequest(request, operations);

    const tableRows = [];
    const totalInAllZonesByUnit = getTotalNeededInAllZones(data, operations);
    for (const planet of Object.keys(data)) {
        for (const operation of Object.keys(data[planet])) {
            for (const name of Object.keys(data[planet][operation])) {
                const relic = getRelicForPlanet(planet);
                data[planet][operation][name].owned =
                    rosters
                        .filter(r => (
                            r.characters.some((c) => c.name === name && Number(c.relic) >= relic)
                                || r.ships.some((s) => s === name)
                        ))
                        .map(r => r.player);
                const owned = data[planet][operation][name].owned;
                tableRows.push({
                    planet,
                    operation,
                    name,
                    total: data[planet][operation][name].total,
                    totalAllZones: totalInAllZonesByUnit[name] ?? 0,
                    owned: `${owned.length}`,
                    owningPlayers: `${owned.length ? `${owned.join(', ')}` : ''}`
                });
            }
        }
    }

    send(getUpdatedReport(tableRows, operations));

    calculating = false;
};

module.exports = { calculate };
