/*
	scrape a website (usually sacred-texts.com) and get paragraphs only
*/

const program = require('commander');
program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);
const fs = require('fs');
var beautiful = require('beautiful-scrape')

const url = program.args[0];
let title = program.args[1];
const scrape = beautiful.scrape(url)
	.then(data => saveText(data));

function saveText(data) {

	const headers = data.findAll('h1');
	if (headers[0]) {
		const t = headers[0].children.find(c => c.type === 'text');
		title = t.raw.replace(/ /g, '_');
	}

	const grafs = data.findAll('p');
	let text = '';
	for (let i = 0; i < grafs.length; i++) {
		const graf = grafs[i];
		let p = '';
		// get rid of grafs with any kind of syling
		if (graf.attribs) continue;
		if (graf.raw !== 'p') continue;
		for (let j = 0; j < graf.children.length; j++) {
			const child = graf.children[j];
			if (child.type === 'text') p += child.raw;

			// <i>
			if (child.children) {
				for (let k = 0; k < child.children.length; k++) {
					if (child.children[k].type === 'text') p += child.children[k].raw;
				}
			}
		}
		// const t = graf.children.find(c => c.type === 'text');
		// if (typeof t === 'undefined') continue;
		p += ' ';
		p = p.replace(/&#\w*;/g, '');
		text += p;
	}



	fs.writeFileSync(`text/${title}.txt`, text);	
}