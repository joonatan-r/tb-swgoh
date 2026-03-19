import React, { useEffect, useRef, useState } from 'react';

const api = (window as any).api;

const getRelicForPlanet = (planet: string) => {
    if (['Mustafar', 'Corellia', 'Coruscant'].includes(planet)) {
        return 5;
    }
    if (['Geonosis', 'Felucia', 'Bracca'].includes(planet)) {
        return 6;
    }
    if (['Dathomir', 'Tatooine', 'Zeffo', 'Kashyyk'].includes(planet)) {
        return 7;
    }
    if (['Haven-class Medical Station', 'Mandalore', 'Kessel', 'Lothal'].includes(planet)) {
        return 8;
    }
    if (['Malachor', 'Vandor', 'Ring of Kafrene', 'Death Star', 'Hoth', 'Scarif'].includes(planet)) {
        return 9;
    }
};

function Component2() {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<string>();
    const [rosters, setRosters] = useState<any[]>([]);

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
        // data[planet][operation][name].total
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
                }
            }
        }
        console.log(data);
        // setContent(JSON.stringify(data, null, 2));
    };

    return (
        <div>
            {loading && (<p>Loading...</p>)}
            <button onClick={update}>Update</button>
            <button onClick={check}>Check</button>
            {/* <span>{content}</span> */}
        </div>
    );
}

export default Component2;
