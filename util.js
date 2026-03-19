
function findWithOpts(str, opts) {
    const matches = [];
    for (let i = opts.startIdx; i < str.length; i++) {
        const startIdxOfMatch = i + opts.matchStart.length;
        if (str.substring(i, startIdxOfMatch) === opts.matchStart) {
            const endIdx = str.indexOf(opts.matchEnd, startIdxOfMatch);
            const matchStr = str.substring(startIdxOfMatch, endIdx);
            if (!opts.where || opts.where(matchStr)) {
                const match = { idx: startIdxOfMatch, result: matchStr };
                if (!opts.all) {
                    return match;
                }
                matches.push(match);
            }
        }
    }
    return matches;
}

function findWithOptsReverse(str, opts) {
    const matches = [];
    for (let i = opts.startIdx; i >= 0; i--) {
        const startIdxOfMatch = i - opts.matchStart.length;
        if (str.substring(startIdxOfMatch, i) === opts.matchStart) {
            const endIdx = str.indexOf(opts.matchEnd, i);
            const matchStr = str.substring(i, endIdx);
            if (!opts.where || opts.where(matchStr)) {
                const match = { idx: startIdxOfMatch, result: matchStr };
                if (!opts.all) {
                    return match;
                }
                matches.push(match);
            }
        }
    }
    return matches;
}

module.exports = {
    findWithOpts,
    findWithOptsReverse
};
