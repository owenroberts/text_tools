/*
	after tagged is done AND sentences are chosen
	if tagged changed again need to update the chosen sentences
	and the save just pos
*/

const fs = require('fs');
const prompt = require('prompt-sync')({ sigint: true });
const logger = require('node-color-log');
const program = require('commander');
program.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);
const { LevenshteinDistance } = require('natural');
const { saveGrammar } = require('./save-grammar.js');
const { createGrammar } = require('./utils.js');

let file = program.args[0];
while (!file) file = prompt('Enter a file name: ');

const taggedFilePath = `./text/${file}-tagged.txt`;
const cfgFilePath = `./data/${file}-cfg.json`;
const cfgSentFilePath = `./data/${file}-sent-cfg.json`;
const cfgPOSFilePath = `./data/${file}-pos-cfg.json`;

const taggedSents = fs.readFileSync(`./text/${file}-tagged.txt`).toString().split('\n');

// lets get regular grammar and tagged sents out of the way
const newGrammar = saveGrammar(file, taggedSents); // saves data/file-cfg.json
const defaultSentanceTags = ['S', 'Q', 'E', 'F'];
const posGrammar = {};
Object.keys(newGrammar)
	.filter(k => !defaultSentanceTags.includes(k))
	.forEach(k => { posGrammar[k] = newGrammar[k]; });
fs.writeFileSync(cfgPOSFilePath, JSON.stringify(posGrammar));

// filter changed sents and save new sent-cfg

// sents chosen already
const chosenSentGrammar = JSON.parse(fs.readFileSync(cfgSentFilePath));

// copy of sent from new cfg
const newSentGrammarStrings = createGrammar(); // save strings
const finalSentGrammar = createGrammar();

// convert new sent grammar to strings
for (const st in newSentGrammarStrings) {
	const newSents = newGrammar[st];
	for (let i = 0; i < newSents.length; i++) {
		newSentGrammarStrings[st].push(newSents[i].join(' '));
	}
}

for (const st in chosenSentGrammar) {
	const chosenSents = chosenSentGrammar[st];
	for (let i = 0; i < chosenSents.length; i++) {
		const sentString = chosenSents[i].join(' ');
		if (newSentGrammarStrings[st].includes(sentString)) {
			finalSentGrammar[st].push(chosenSents[i]);
		} else {
			let d = 1000;
			let string;
			for (let j = 0; j < newSentGrammarStrings[st].length; j++) {
				let l = LevenshteinDistance(newSentGrammarStrings[st][j], sentString);
				if (l < d) {
					string = newSentGrammarStrings[st][j]
					d = l;
				}
			}
			if (d < 3) finalSentGrammar[st].push(chosenSents[i]);
		}
	}
}


fs.writeFileSync(`./data/${file}-sent-cfg.json`, JSON.stringify(finalSentGrammar));