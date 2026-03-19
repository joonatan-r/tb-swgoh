
import fs from 'fs';
import { decode } from 'html-entities';

const data = fs.readFileSync('t2.html', 'utf-8');

console.log('\n\n\n')

const regexp = /unit-card__primary.*?relic-badge.*?<text.*?>([0-9]*)<.*?unit-card__name".*?>(.*?)<\//g;
const matches = data.matchAll(regexp);
let l = 0;

for (const match of matches) {
//   console.log(match[0]);
  console.log(match[1]); // relic
  console.log(decode(match[2])); // name
  l++;
}

console.log(l)

console.log('\n\n\n')
