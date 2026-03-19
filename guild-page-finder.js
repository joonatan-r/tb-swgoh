
const { findWithOpts, findWithOptsReverse } = require('./util');

async function getGuildPage(idx, searchStr) {
    const baseUrl = 'https://swgoh.gg/g/?page='
    let found = false
    let info = undefined
    await fetch(baseUrl + idx)
        .then(r => r.text())
        .then(r => {
            const result1 = findWithOpts(r, {
                startIdx: 0,
                matchStart: "class=\"mb-1\">\n",
                matchEnd: "\n",
                where: (s) => s.toLowerCase().indexOf(searchStr.toLowerCase()) >= 0,
                all: false,
            })
            found = !!result1?.result?.length;
            const result2 = findWithOptsReverse(r, {
                startIdx: result1.idx,
                matchStart: "href=\"",
                matchEnd: "\"",
                all: false,
            })
            if (found) {
                info = '{ "name": "' + result1.result + '", "url": "' + result2.result + '" }'
            }
        })
    return [found, info]
}

// async function find() {
//     const searchStr = process.argv[2]
//     let idx = 1
//     let found = false
//     let info = undefined
    
//     while (/* !found && */ idx < 420) {
//         [found, info] = await getGuildPage(idx++, searchStr)
//         if (found) console.log(info)
//     }
// }

// find()

module.exports = getGuildPage;
