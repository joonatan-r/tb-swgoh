import React, { useEffect, useRef, useState } from 'react';

const api = (window as any).api;

const reqs = {

};

function Component2() {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<string>();
    const [rosters, setRosters] = useState<any>([]);

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
                // setContent(JSON.stringify(relicsAnd7StarShips, null, 4));
                setLoading(false);
            });
    };

    return (
        <div>
            {loading && (<p>Loading...</p>)}
            <button onClick={update}>Update</button>
            <span>{content}</span>
        </div>
    );
}

export default Component2;
