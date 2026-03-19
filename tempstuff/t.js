
import fs from 'fs';
import { decode } from 'html-entities';

const data = fs.readFileSync('test.html', 'utf-8');

console.log('\n\n\n')

// const regexp = /<a href="(\/p\/[0-9]*\/)">.*?font-bold.*?>(.*?)</g;
// const matches = data.matchAll(regexp);
// let l = 0;

// for (const match of matches) {
//   console.log(match[1]); // player url
//   console.log(decode(match[2])); // player name
//   l++;
// }

    const regexp = /<a href="(\/p\/[0-9]*\/)">.*?font-bold.*?>(.*?)</g;
    const matches = data.replace(/\r?\n|\r/g, '').matchAll(regexp);
    const urlsAndNames = [];
    for (const match of matches) {
        urlsAndNames.push({
            url: match[1].trim(),
            name: decode(match[2]).trim()
        });
    }
    console.log(urlsAndNames)

//                                                    this
// match[1] -> player url like https://swgoh.gg + /p/696594182/ + characters/
// also + ships/

// console.log(l)

console.log('\n\n\n')
