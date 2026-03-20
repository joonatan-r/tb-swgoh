import React, { useEffect, useRef, useState } from 'react';

const api = (window as any).api;

const getRelicForPlanet = (planet: string) => {
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

const getTotalNeededInAllZones = (data: any, operations: any) => {
    const totalInAllZonesByUnit: any = {};
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

function Component2() {
    const [loading, setLoading] = useState(false);
    const [rosters, setRosters] = useState<any[]>([]);
    const [result, setResult] = useState<any[]>();
    const [operations, setOperations] = useState<any>({
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
    });
    const [tooltip, setTooltip] = useState<any>();

    const update = () => {
        setLoading(true);
        api.invoke('get-player-urls-and-names', '/g/EEpS_QXuQ_ich2gMobNTTA/').then(async (urlsAndNames: any) => {
                const relicsAnd7StarShips = [];
                for (const player of urlsAndNames) {
                    console.log(player);
                    const characters = await api.invoke('get-relic-characters', player.url + 'characters/');
                    const ships = await api.invoke('get-7-start-ships', player.url + 'ships/');
                    relicsAnd7StarShips.push({
                        player: player.name,
                        characters,
                        ships
                    });
                }
                return relicsAnd7StarShips;
            })
            .then((relicsAnd7StarShips: any) => {
                setRosters(relicsAnd7StarShips);
                console.log(relicsAnd7StarShips);
                setLoading(false);
            });
    };

    const check = async () => {
        const data = await api.invoke('get-data');
        const tableRows = [];
        const totalInAllZonesByUnit: any = getTotalNeededInAllZones(data, operations);
        for (const planet of Object.keys(data)) {
            for (const operation of Object.keys(data[planet])) {
                for (const name of Object.keys(data[planet][operation])) {
                    const relic = getRelicForPlanet(planet);
                    data[planet][operation][name].owned =
                        rosters
                            .filter(r => (
                                r.characters.some((c: any) => c.name === name && Number(c.relic) >= relic)
                                    || r.ships.some((s: any) => s === name)
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
        setResult(tableRows);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={update} disabled={loading} style={{ margin: 8 }}>Fetch data</button>
            <button onClick={check} disabled={loading} style={{ margin: 8 }}>Calculate</button>
            {loading && (<span>Loading...</span>)}
            <table id="checkboxTable">
                <thead>
                    <tr>
                        <th></th>
                        <th>All</th>
                        {Object.keys((Object.values(operations)[0] as any)).map(o => (
                            <th>{o}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(operations).map(planet => (
                        <tr>
                            <td>{planet}</td>
                            <td>
                                <input
                                    type='checkbox'
                                    checked={Object.values(operations[planet]).every(v => v)}
                                    onChange={() => setOperations({
                                        ...operations,
                                        [planet]: Object.values(operations[planet]).every(v => v)
                                            ? { ...operationsBase }
                                            : { ...operationsAll }
                                    })}
                                >
                                </input>
                            </td>
                            {Object.keys(operations[planet]).map(o => (
                                <td>
                                    <input
                                        type='checkbox'
                                        checked={operations[planet][o]}
                                        onChange={() => setOperations({
                                            ...operations,
                                            [planet]: {
                                                ...(operations[planet]),
                                                [o]: !operations[planet][o]
                                            }
                                        })}
                                    >
                                    </input>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {result && (
                <table style={{ margin: 10 }} id="resultTable">
                    <thead>
                        <tr>
                            <th>Planet</th>
                            <th>Operation</th>
                            <th>Unit</th>
                            <th>Needed</th>
                            <th>All zones</th>
                            <th>Owned</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.map((r, i) => (operations[r.planet]?.[r.operation]) && (
                            <tr className={ r.planet !== result[i - 1]?.planet ? 'firstRow' : '' }>
                                <td>{r.planet}</td>
                                <td>{r.operation}</td>
                                <td>{r.name}</td>
                                <td>{r.total}</td>
                                <td>{r.totalAllZones}</td>
                                <td
                                    style={{ cursor: 'help' }}
                                    onMouseEnter={e => setTooltip({
                                        x: e.pageX,
                                        y: e.pageY,
                                        content: r.owningPlayers
                                    })}
                                    onMouseLeave={() => setTooltip(undefined)}
                                >
                                    {r.owned}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {tooltip && (
                <div
                    style={{
                        position: 'absolute',
                        background: 'white',
                        border: '1px solid gray',
                        padding: 10,
                        top: `${tooltip.y + 10}px`,
                        left: `${tooltip.x + 10}px`
                    }}
                >
                    <p>{tooltip.content}</p>
                </div>
            )}
        </div>
    );
}

export default Component2;
