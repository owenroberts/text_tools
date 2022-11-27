/*
	prints versions of possible sentences using CFG for inclusion/exclusion from sent-cfg used for sentences
*/

const fs = require('fs');
const prompt = require('prompt-sync')({ sigint: true });
const logger = require('node-color-log');
const program = require('commander');
program.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);

const { CFGGenerator } = require('./CFGGenerator.js');
const { getTags, taggedFromTaggedSent, sentFromTaggedSent } = require('./utils.js');

let file = program.args[0];
while (!file) file = prompt('Enter a file name: ');
const fileName = file.replace(/.txt|.*\/|-prepped/g, '');
const n = program.args[1] || 6;

const cfgFilePath = `./data/${fileName}-cfg.json`;
const cfgSentFilePath = `./data/${fileName}-sent-cfg.json`;
const cfgPOSFilePath = `./data/${fileName}-pos-cfg.json`;

const tagged = fs.readFileSync(`./text/${fileName}-tagged.txt`).toString().split('\n');
const originals = {};
tagged.forEach(taggedSent => {
	const tagString = getTags(taggedFromTaggedSent(taggedSent)).join(' ');
	const sent = sentFromTaggedSent(taggedSent);
	originals[tagString] = sent;
});
const grammar = JSON.parse(fs.readFileSync(cfgFilePath));
const gen = new CFGGenerator();
gen.feed('test', grammar);

const sentGrammar = fs.existsSync(cfgSentFilePath) ? 
	JSON.parse(fs.readFileSync(cfgSentFilePath)) :
	{};

const defaultSentanceTags = ['S', 'Q', 'E', 'F'];
logger.color('green')
	.log(defaultSentanceTags.map(tag => `${tag} ${grammar[tag].length}`).join(' / '));

defaultSentanceTags.forEach(st => {
	const testSentences = grammar[st];
	let testIndex = 0;
	if (sentGrammar[st]) {
		for (let i = 0; i < testSentences.length; i++) {
			if (sentGrammar[st].map(s => s.join(' ')).includes(testSentences[i].join(' '))) {
				testIndex = i + 1;
			}
		}
		if (testIndex === testSentences.length - 1) return;
	} else {
		sentGrammar[st] = [];
	}
	for (let i = testIndex; i < testSentences.length; i++) {
		const testSent = testSentences[i];
		logger.color('yellow').log(st).joint()
			.color('red').log(` ${i}/${testSentences.length}`).joint()
			.color('green').log(` ${sentGrammar[st].length}/${testSentences.length}`);
		logger.color('cyan').log('Original: ').joint()
			.color('white').log(originals[testSent.join(' ')]);
		logger.color('yellow').log(testSent.join(' '));
		for (let j = 0; j < n; j++) {
			const ovr = {};
			ovr[st] = [testSent];
			const genSent = gen.getText('test', st, ovr);
			logger.color('cyan').log(j);
			logger.color('white').log(genSent.text);

		}
		let useSent = prompt('Use this sentence? (S to save and quit) Y/n ', 'y');
		if (useSent.toLowerCase() === 'y') sentGrammar[st].push(testSent);
		if (useSent.toLowerCase() === 's') save();
	}
});

save();

function save() {
	const posGrammar = {};
	Object.keys(grammar)
		.filter(k => !defaultSentanceTags.includes(k))
		.forEach(k => { posGrammar[k] = grammar[k]; });
	fs.writeFileSync(cfgPOSFilePath, JSON.stringify(posGrammar));
	fs.writeFileSync(cfgSentFilePath, JSON.stringify(sentGrammar));
	process.exit();
}


