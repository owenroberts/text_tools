/*
	save grammar json file from tagged file
	basic sentence types are S: sentence, ends in ., Q: question ?, E: exclamation !, F fragment anything else like — or …
*/

const program = require('commander');
program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);
const fs = require('fs');
const { taggedFromTaggedSent, addTagsToGrammar, addTaggedWordsToGrammar, createGrammar } = require('./utils.js');

function saveGrammar(fileName, taggedSents, maxLength, exitOnFinish) {

	if (!maxLength) maxLength = 1000;
	const grammar = createGrammar();

	for (let i = 0; i < taggedSents.length; i++) {
		let tagged = taggedFromTaggedSent(taggedSents[i]);

		// only add short - medium sentences to grammar (still adds words)
		// prob don't use with markov
		if (tagged.length <= maxLength) {
			addTagsToGrammar(tagged, grammar, true);
		}
		addTaggedWordsToGrammar(tagged, grammar);
	}

	// grammar = removeSingles(grammar);

	let data = JSON.stringify(grammar);
	fs.writeFileSync(`data/${fileName}-cfg.json`, data);
	if (exitOnFinish) process.exit();
	else return grammar;
}

// check grammar for tags with one terminal -- what about to/TO etc.
function removeSingles(grammar) {
	let tags = Object.keys(grammar).filter(t => !'SQEF'.includes(t));
	tags.forEach(tag => {
		if (grammar[tag].length === 1) {
			let terminal = grammar[tag][0][0];
			'SQEF'.split('').forEach(sentType => {
				grammar[sentType].forEach((tagSet, i) => {
					tagSet.forEach((t, j) => {
						if (t === tag) grammar[sentType][i][j] = terminal;
					});
				});
			});
			delete grammar[tag];
		}
	});
	return grammar;
}

if (require.main === module) {
	const prompt = require('prompt-sync')({ sigint: true });
	let file = program.args[0];
	while (!file) file = prompt('Enter a file name: ');
	const fileName = file.replace(/.txt|.*\/|-prepped/g, '');
	const maxLength = program.args[1] || 1000;
	const taggedSents = fs.readFileSync(`text/${fileName}-tagged.txt`).toString().split('\n');
	saveGrammar(fileName, taggedSents, maxLength, true);
}

module.exports = { saveGrammar };