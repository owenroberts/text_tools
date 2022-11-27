/*
	command line utility to pos tag a text file
	saves to tagged text file
	can be stopped and restarted
	tagged file used to generate corpus with adjusted rules
	file is first parameter, 1 for manual tagging without input
*/

const fs = require('fs');
const cp = require('child_process');
const logger = require('node-color-log');
const prompt = require('prompt-sync')({ sigint: true });
const program = require('commander');
program
	.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);

const natural = require('natural');
// different tokenizers: http://naturalnode.github.io/natural/Tokenizers.html
const wordTokenizer = new natural.WordPunctTokenizer(); // WordTokenizer -- no punctuation ...
const sentTokenizer = new natural.SentenceTokenizer();

const { formatLine, formatSent, formatSents, formatTagged, formatPunc, replacePOS, taggedFromTaggedSent, taggedSentFromTagged, getTags, sentFromTaggedSent, sentFromTagged, addTaggedWordsToGrammar, createGrammar, combineNNP } = require('./utils.js');

const { saveGrammar } = require('./save-grammar.js');

const defaultCategory = '@';
const lexicon = new natural.Lexicon('EN', defaultCategory);
const ruleSet = new natural.RuleSet('EN');
const tagger = new natural.BrillPOSTagger(lexicon, ruleSet);

const file = program.args[0];
while (!file) file = prompt('Enter a file name: ');
const fileName = file.replace(/.txt|.*\/|-prepped/g, '');
const useContractionPOS = false; // tag contractions as POS+POS -- test this ...
const runWithoutInput = program.args[1] === '' + 1; // run with out manual review
const text = fs.readFileSync(file, 'utf-8');
const taggedFile = fs.existsSync(`text/${fileName}-tagged.txt`) ?
	fs.readFileSync(`text/${fileName}-tagged.txt`).toString().split('\n'):
	[];
const grammar = fs.existsSync(`data/${fileName}-cfg.json`) ?
	JSON.parse(fs.readFileSync(`data/${fileName}-cfg.json`)) :
	createGrammar();

// add cfg generator here?

let startIndex = 0;
let startResponse = prompt("Start from last sentence? (# for sentence index) Y/n : ", 'y')
	.toLowerCase();
if (startResponse === 'y') startIndex = taggedFile.length;
else if (!isNaN(+startResponse)) startIndex = +startResponse;

 // save the tags that aren't going to rewrite
let taggedSents = (startIndex > 0 && taggedFile.length > 0) ?
	taggedFile.slice(0, startIndex) :
	[];

let changedTags = {}; // saved tags that have been chanced to check for future instances

const lines = text.split(/\r?\n/);
let sentenceIndex = 0; // lines have multiple sentences

// this is the main loop
for (let i = 0; i < lines.length; i++) {
	if (lines[i].length === 0) continue; // skip lines that are empty
	let line = formatLine(formatSent(lines[i])); // add period to unended lines for sent tokenization
	let sentences = sentTokenizer.tokenize(line);
	sentences = formatSents(sentences); // split : and ;

	for (let j = 0; j < sentences.length; j++) {
		let sentence = sentences[j];
		sentence = formatSent(sentence);
		
		// skip sentence if starting later
		if (sentenceIndex < startIndex) {
			// add to grammar bc txt will always be same but grammar adds wrong info
			if (taggedSents[sentenceIndex]) {
				let tagged = taggedFromTaggedSent(taggedSents[sentenceIndex]);
				addTaggedWordsToGrammar(tagged, grammar);
			} else {
				logger.color('red').log('sentence ', sentenceIndex, ' not saved');
			}

			sentenceIndex++;
			continue;
		}

		const tokens = wordTokenizer.tokenize(sentence);
		if (tokens.length === 0) continue; // ignore empty sentences

		let tagged = tagger.tag(tokens).taggedWords;
		
		tagged = replacePOS(tagged);
		tagged = formatPunc(tagged);
		tagged = combineNNP(tagged);
		tagged = findContractions(tagged);
		tagged = checkExistingGrammar(tagged);


		 // print sent for review
		// logger.color('cyan').log('-->', sentenceIndex, i, j, `(/${lines.length})`);
		logger.color('cyan')
			.log('Index', sentenceIndex, `(${i}/${lines.length})`, `(${j}/${sentences.length})`);
		logger.color('green').log('Tagged > ').joint()
			.color('white').log(taggedSentFromTagged(tagged));

		// check for sentence in file
		if (taggedSents[sentenceIndex]) {
			logger.color('yellow').log('From file > ').joint()
				.color('white').log(taggedSents[sentenceIndex]);
			const useTagfileSentence = prompt("Use tagged from file? Y/n: ", 'y').toLowerCase();
			if (useTagfileSentence === 'y') {
				tagged = taggedFromTaggedSent(taggedSents[sentenceIndex]);
			}
		}

		tagged = checkChanged(tagged); // check for previous changes to same tag

		const acceptFullSentence = runWithoutInput ? 'y' :
			prompt("Accept full sentence? (R rewrite/ N change tags / Q save and quit) Y/n: ", 'y')
			.toLowerCase();

		// add see examples here ..

		if (acceptFullSentence === 'q') {
			save();
			break;
		}

		// rewrite sentence fully or individual tags
		if (!runWithoutInput) {
			
			if (acceptFullSentence === 'r') {
				let rewriteFileName = 'rewrite.txt';
				let rewriteFile = fs.writeFileSync(rewriteFileName, taggedSentFromTagged(tagged));
				let editorProgram = process.platform === 'linux' ? 'gedit' : 'vim';
				let editor = cp.spawnSync(editorProgram, [rewriteFileName], { stdin: 'inherit', stdio: 'inherit', detached: true });
				let rewriteSent = fs.readFileSync(rewriteFileName)
					.toString()
					.replace('\n', ''); // ever going to have line breaks here?
				tagged = taggedFromTaggedSent(rewriteSent);
				fs.unlinkSync(rewriteFileName);
			} else if (acceptFullSentence === 'n'||
				getTags(tagged).join('').includes(defaultCategory)) {
				tagged = updateSentence(tagged, acceptFullSentence !== 'n');
			}
		}


		addTaggedWordsToGrammar(tagged, grammar);
		taggedSents.push(taggedSentFromTagged(tagged));
		sentenceIndex++
	}
}
save();

function checkChanged(tagged) {
	for (let i = 0; i < tagged.length; i++) {
		const { token, tag } = tagged[i];
		const key = `${token}/${tag}`;
		if (changedTags[key]) {
			const newTag = changedTags[key];
			logger.color('magenta').log('> Tag previously changed: ', token, tag, newTag);
			const changeTagPrompt = prompt('Use previous change? (default yes/ n no)', 'y');
			if (changeTagPrompt === 'y') {
				tagged[i].tag = newTag;
				console.log('new tagged: ', taggedSentFromTagged(tagged));
			}
		}
 	}
 	return tagged;
}

function findContractions(tagged) {
	// -- WordPunct tokenizes ' as '/"
	for (let i = tagged.length - 1; i >= 0; i--) {
		if (tagged[i].token === "'") {
			let tags = tagged.slice(i-1, i+2);
			let token = tags.map(t => t.token).join('')
			tagged[i-1].token = token;
			tagged[i-1].tag = useContractionPOS ? 
				tags[0].tag + '+' + tags[2].tag :
				token;
			tagged.splice(i, 2);
		}
	}
	return tagged;
}

// make changes to the tagged sentence
function updateSentence(tagged, onlyUnknown) {
	for (let i = 0; i < tagged.length; i++) {
		const { token, tag } = tagged[i];
		if ('!?.,:'.includes(tag)) continue;
		if (onlyUnknown && !tag.includes(defaultCategory)) continue;
		logger.color('yellow').log('update: ', token, tag);
		const enterNewTag = prompt('Enter new tag (Enter to keep tag / Redo to start over): ', tag);
		if (enterNewTag.toLowerCase() === 'redo') {
			updateSentence(tagged, false);
			break;
		}
		tagged[i].tag = (token === enterNewTag) ? 
			enterNewTag : 
			enterNewTag.toUpperCase();
		changedTags[`${token}/${tag}`] = tagged[i].tag;
	}
	return tagged;
}

function checkExistingGrammar(tagged) {
	// add unknown pos from existing grammar
	for (let i = 0; i < tagged.length; i++) {
		const { token, tag } = tagged[i];
		if (tag.includes(defaultCategory)) {
			for (const k in grammar) {
				if (grammar[k].flatMap(e => e).includes(token.toLowerCase())) {
					tagged[i].tag = k;
				}
			}
		}
	}
	return tagged;
}

function save() {
	fs.writeFileSync(`text/${fileName}-tagged.txt`, taggedSents.join('\n'));
	saveGrammar(fileName, taggedSents);
	process.exit();
}