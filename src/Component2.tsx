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
    const [report, setReport] = useState<any>();

    const update = () => {
        setLoading(true);
        api.invoke('get-player-urls-and-names').then(async (urlsAndNames: any) => {
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

    useEffect(() => {
        setReport(getUpdatedReport());
    }, [result]);

    const formatReportObject = (obj: any) => {
        return Object.keys(obj).map(key => `${key} (${obj[key].join(', ')})`).join(',\n') + '\n';
    };

    const getUpdatedReport = (): any => {
        if (!result?.length) {
            return undefined;
        }
        const notPossible = {} as any;
        const notAllPossible = {} as any;
        const notAllPossibleAutoRemoved = {} as any;
        const exactlyPossibleOneOp = {} as any;
        const exactlyPossibleSeveralOps = {} as any;
        const exactlyPossibleSeveralOpsAutoRemoved = {} as any;
        const notPossibleOps = [] as any[];
        const resultCopy = JSON.parse(JSON.stringify(result)) as any[]; // lazy way to copy
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
            } else if (Number(row.owned) < Number(row.totalAllZones)) {
                if (!notAllPossible[`${row.planet} ${row.operation}`]) {
                    notAllPossible[`${row.planet} ${row.operation}`] = [];
                }
                notAllPossible[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
            } else if (`${row.owned}` === `${row.total}`) {
                if (!exactlyPossibleOneOp[`${row.planet} ${row.operation}`]) {
                    exactlyPossibleOneOp[`${row.planet} ${row.operation}`] = [];
                }
                exactlyPossibleOneOp[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.total}`);
            } else if (`${row.owned}` === `${row.totalAllZones}`) {
                if (!exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`]) {
                    exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`] = [];
                }
                exactlyPossibleSeveralOps[`${row.planet} ${row.operation}`].push(`${row.name} ${row.owned}/${row.totalAllZones}`);
            }
        }
        const unitsToRemove = {} as any;
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
        if (!Object.keys(notPossible).length && !Object.keys(notPossible).length
                && !Object.keys(notPossible).length && !Object.keys(notPossible).length
                && !Object.keys(notPossible).length &&!Object.keys(notPossible).length) {
            return undefined;
        }
        return (
            <div style={{ marginTop: 10, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                <p style={{ fontWeight: 'bold' }}>Not possible:</p>
                <p>{formatReportObject(notPossible)}</p>
                <p style={{ fontWeight: 'bold' }}>Not all possible (still counting units from not possible operations):</p>
                <p>{formatReportObject(notAllPossible)}</p>
                <p style={{ fontWeight: 'bold' }}>Not all possible (assuming no units put to not possible operations):</p>
                <p>{formatReportObject(notAllPossibleAutoRemoved)}</p>
                <p style={{ fontWeight: 'bold' }}>Exactly possible (considering one operation):</p>
                <p>{formatReportObject(exactlyPossibleOneOp)}</p>
                <p style={{ fontWeight: 'bold' }}>Exactly possible (considering all operations, still counting units from not possible operations):</p>
                <p>{formatReportObject(exactlyPossibleSeveralOps)}</p>
                <p style={{ fontWeight: 'bold' }}>Exactly possible (considering all operations, assuming no units put to not possible operations):</p>
                <p>{formatReportObject(exactlyPossibleSeveralOpsAutoRemoved)}</p>
            </div>
        );
    };

    return (
        <div style={{ position: 'relative', marginBottom: 300 }}>
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
            {report && report}
            {result && (
                <table id="resultTable">
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
                            <tr
                                className={
                                    r.planet !== result[i - 1]?.planet
                                        ? 'firstRowPlanet'
                                        : r.operation !== result[i - 1]?.operation ? 'firstRowOp' : ''
                                }
                            >
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
