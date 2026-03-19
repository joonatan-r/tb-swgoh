
import React, { useEffect, useRef, useState } from 'react';
import SvgComponent from './SvgComponent';

const api = (window as any).api;

interface Guild {
    name: string;
    url: string;
    fav?: boolean;
}

interface Player {
    name: string;
    gp: string;
    teams?: number;
    fixedTeams?: number;
}

function getAsNumberOrUndefined(value: string) {
    if (value === "") return undefined;
    const n = Number(value);
    if (isNaN(n)) return undefined;
    return n;
}

function GuildTable(
    props: {
        allGuilds: Guild[];
        favGuilds: Guild[];
        setFavGuilds: (arg: any) => void;
        setSelectedGuild: (arg: any) => void;
    }
) {
    const { allGuilds, favGuilds, setFavGuilds, setSelectedGuild } = props;
    const isLastFav = (g: Guild) => {
        return !!favGuilds.length && favGuilds.indexOf(g) === favGuilds.length - 1;
    };
    const isFirstNonFav = (g: Guild) => {
        return !g.fav && allGuilds[allGuilds.indexOf(g) - 1]?.fav;
    };
    return (
        <table>
            <tbody>
                {allGuilds.map(g => (
                    <tr
                        className={
                            isLastFav(g)
                                ? "last-fav-guild"
                                : isFirstNonFav(g) ? "first-non-fav-guild" : ""
                        }
                    >
                        <td>{g.name}</td>
                        <td>
                            <button
                                style={{ marginLeft: 30 }}
                                onClick={() => {
                                    api.invoke("guild-search-stop");
                                    setSelectedGuild(g);
                                }}
                            >
                                Select
                            </button>
                        </td>
                        <td>
                            <button
                                style={{ marginLeft: 10 }}
                                onClick={() => {
                                    const newFavGuilds =
                                        (g.fav)
                                            ? favGuilds.filter(fg => fg.url !== g.url)
                                            : favGuilds.concat({ ...g, fav: true });
                                    api.invoke("write-config", { favorites: newFavGuilds });
                                    setFavGuilds(newFavGuilds);
                                }}
                            >
                                {g.fav ? "Unfavorite" : "Favorite"}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function PlayerTable(props: { players: Player[]; setPlayers: (arg: any) => void }) {
    return (
        <table>
            <tbody>
                {props.players.map(p => (
                    <tr>
                        <td>{p.name}</td>
                        <td>{p.gp}</td>
                        <td>{(typeof p.teams !== "undefined") ? p.teams : ""}</td>
                        <td>
                        <input
                            type="text"
                            size={4}
                            onChange={e =>
                                props.setPlayers((prevPlayers: Player[]) =>
                                    prevPlayers.map(prev =>
                                        (prev === p)
                                            ? {
                                                ...p,
                                                fixedTeams: getAsNumberOrUndefined(e.target.value)
                                            }
                                            : prev
                                    )
                                )
                            }
                            value={(typeof p.fixedTeams === "undefined") ? "" : p.fixedTeams}
                        ></input>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Component() {
    const [searchStr, setSearchStr] = useState("");
    const [searching, setSearching] = useState(false);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [favGuilds, setFavGuilds] = useState<Guild[]>([]);
    const [selectedGuild, setSelectedGuild] = useState<Guild | undefined>();
    const [players, setPlayers] = useState<Player[]>([]);
    const minTeams = useRef<any>();
    const maxTeams = useRef<any>();
    const totalTeams = useRef<any>();
    const allGuilds = selectedGuild ? [] : [...favGuilds, ...guilds];

    useEffect(() => {
        api.invoke("get-config").then((config: any) => setFavGuilds(config?.favorites || []));
    }, []);

    useEffect(() => {
        setGuilds([]);
        selectedGuild
            && api.invoke("get-players", "https://swgoh.gg" + selectedGuild?.url)
                .then((p: any) => setPlayers(p));
    }, [selectedGuild]);

    const search = async () => {
        setGuilds([]);
        setPlayers([]);
        setSelectedGuild(undefined);
        setSearching(true);
        api.invoke("get-guild-page", searchStr);
        api.on("guild-found", (event: any, value: any) => {
            try {
                const newGuild = JSON.parse(value);
                if (!favGuilds.find(g => g.url === newGuild.url)) {
                    setGuilds(prevGuilds => [...prevGuilds, newGuild]);
                }
            } catch (e) {
                console.error(e);
            }
        }, true);
        api.once("guild-search-end", () => setSearching(false));
    };
    const calculateTeams = async () => {
        // const teams =
        //     await api.invoke(
        //         "calculate-teams",
        //         Number(totalTeams.current?.value),
        //         Number(minTeams.current?.value),
        //         Number(maxTeams.current?.value),
        //         players
        //     );
        // teams?.length
        //     && setPlayers(prevPlayers =>
        //         prevPlayers.map(p => (
        //             {
        //                 ...p,
        //                 teams: teams.find((t: any) => t.name === p.name)?.teams
        //             }
        //         ))
        //             .sort((a, b) => Number(b.gp) - Number(a.gp))
        //     );
    };

    return (
        <>
            <input
                type="text"
                onChange={e => setSearchStr(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") search(); }}
                value={searchStr}
            ></input>
            <button onClick={search}>
                Search
            </button>
            {searching && <button onClick={() => { api.invoke("guild-search-stop"); }}>Stop</button>}
            {!!selectedGuild && (
                <button onClick={() => { setSelectedGuild(undefined); setPlayers([]); }}>Unselect</button>
            )}
            {!!players.length && (
                <div>
                    <input type="text" ref={minTeams} placeholder="Min teams per player"></input>
                    <input type="text" ref={maxTeams} placeholder="Max teams per player"></input>
                    <input
                        type="text"
                        ref={totalTeams}
                        placeholder="Total teams"
                        onKeyDown={e => { if (e.key === "Enter") calculateTeams(); }}
                    ></input>
                    <button onClick={calculateTeams}>
                        Calculate teams
                    </button>
                </div>
            )}
            {!!players.length && (
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(
                            players.map(p => p.name + " = " + (Number(p.teams) || 0)).join(",\n")
                        );
                    }}
                >
                    Copy
                </button>
            )}
            <div style={{ padding: 12 }}></div>
            <GuildTable
                allGuilds={allGuilds}
                favGuilds={favGuilds}
                setFavGuilds={setFavGuilds}
                setSelectedGuild={setSelectedGuild}
            />
            {searching && <p>Searching...</p>}
            {!!players.length &&
                <PlayerTable players={players} setPlayers={setPlayers} />
            }
            {/* <SvgComponent /> */}
        </>
    );
}

export default Component;
