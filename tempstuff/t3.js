
import fs from 'fs';
import { decode } from 'html-entities';

const data = fs.readFileSync('t3.html', 'utf-8');

console.log('\n\n\n')

const regexp = /unit-card__primary(.*?)unit-card__name".*?>(.*?)<\//g;
const matches = data.matchAll(regexp);
let l = 0;

for (const match of matches) {
  const inactiveStarsLength = (match[1].match(/rarity-range__star--inactive/g) || []).length;
  console.log(7 - inactiveStarsLength) // stars
  console.log(decode(match[2])); // name
  l++;
}

console.log(l)

console.log('\n\n\n')
