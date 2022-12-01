/*
	run a gutenberg to remove line breaks, foot notes, capitalized titles
	options?
	remove relevant section from the main file first, cutting front and end matter
*/
const program = require('commander');
program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);
const fs = require('fs');
const removeDiacritics = require('diacritics').remove;

const file = program.args[0];
while (!file) file = prompt('Enter a file name: ');

let text = fs.readFileSync(file, 'utf-8');

// remove diagritics (accent marks etc)
text = removeDiacritics(text);

// remove references (anything bewteen [])
text = text.replace(/\[[^\]]*\]/g, '');

// and numbers between ()
text = text.replace(/\(\d*\)/g, '')

// remove capitalized chapter titles
text = text.replace(/^[A-Z\s\.]*^/gm, '');

// remove gutenberg line breaks
text = text.replace(/\n+/g, ' ')

// save "prepped" file
fs.writeFileSync(file.replace('.txt', '') + '-prepped.txt', text);