export interface WorldProxy {
    L: number;
    W: number;
    H: number;
    fields: string[][];
}

export function generateProxiesFromString(worldStr: string): WorldProxy[] {
    let worldCells = worldStr
        .split("x")
        .map((w: string) => w.split("\n").map((r: string) => r.split(";")));

    worldCells.shift(); // space before x is empty

    let newProxies: WorldProxy[] = [];

    for (const w of worldCells) {
        let header = w.shift(); // first row
        if (!header) throw "Weltformat fehlerhaft!";
        newProxies.push({
            L: parseInt(header[1]),
            W: parseInt(header[2]),
            H: parseInt(header[3]),
            fields: w,
        });
    }

    return newProxies;
}
