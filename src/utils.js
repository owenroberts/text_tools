const { replacements } = require('./replacements.js');

// tagging utils
function formatLine(line) {
	// remove ending non-!?. puncs (if preceded by .)
	if (!'!.?:'.includes(line[line.length - 1])) {
		line += '.'; // just add a period if ones not there, other shit will get stripped later
	}
	return line;
}

function formatSents(sentences) {
	// add ; to parsing for symbolism of the tarot
	sentences = sentences.flatMap(sent => {
		if (sent.match(/:|;/g)) {
			return sent
				.split(/:|;/g)
				.filter(e => e.length > 0)
				.map(s => {
					s = s.replace(/^\s+/, '');
					if (!'.?!'.includes(s[s.length - 1])) {
						s += '.';
					}
					return s;
				});
		} else {
			return sent;
		}
	});

	sentences = sentences.filter(s => s !== '');
	return sentences;
}

function formatSent(sentence) {
	// dashes
	sentence = sentence.replace(/\s+$/, ''); // remove trailing spaces
	sentence = sentence.replace(/(^-+)|(-+$)/g, ''); // end and beginning dashes
	sentence = sentence.replace(/[,"]--+/g, ' '); // comma dashes
	sentence = sentence.replace(/--+/g, ','); // middle dashes
	// ellipses

	// remove quotes
	sentence = sentence.replace(/"/g, '');
	sentence = sentence.replace(/(?<!\s+\w+s)\'(?![stmd] |re |ve |ll |em )/g, ''); // remove single non-possessive contractions
	return sentence;
}

function replacePOS(tagged) {
	// replace PRP, DT, VBP
	for (let i = 0; i < tagged.length; i++) {
		const { token, tag } = tagged[i];

		if (replacements.tokens.includes(token.toLowerCase())) {
			tagged[i].tag = token;
			continue;
		}

		for (const pos in replacements.tags) {
			if (tag.match('^' + pos)) {
				let foundPOS = false;
				// if more than one need to ask ...

				for (const t in replacements.tags[pos]) {
					if (replacements.tags[pos][t].includes(token.toLowerCase())) {
						tagged[i].tag = t;
						foundPOS = true;
					}
				}
				if (!foundPOS) {
					if (!pos.includes('NN')) console.log('replace pos not found', pos, token, tag);
				}
			}
		}
	}
	return tagged;
}

function formatPunc(tagged) {
	let len = tagged.length;
	
	// add ? tag - brill adds only . and !
	if (tagged[len - 1].token === '?') {
		tagged[len - 1].tag = '?';
	}

	// if next to last token is only punctuation, remove period at the end
	if (tagged[len - 1].token === '.' && 
		!tagged[len - 2].token.match(/[a-zA-Z0-9]/g)) {
		tagged.pop();
	}

	return tagged;
}

function combineNNP(tagged) {
	for (let i = tagged.length - 1; i >= 0; i--) {
		if (tagged[i].tag === 'NNP' && tagged[i+1].tag === 'NNP') {
			tagged[i].token += ' ' + tagged[i+1].token;
			tagged.splice(i+1, 1);
		}
	}
	return tagged;
}

function taggedSentFromTagged(tagged) {
	// better name for tagged sentence string ? 
	return tagged.map(t => `${t.token}/${t.tag}`).join(' ');
}

function taggedFromTaggedSent(taggedSentence) {
	return taggedSentence
		// .split(' ')
		// .split(/(?<=\/\w+) /g) // allows for words with spaces
		.split(/(?<=\/\S+) /g) // fix for punc
		.map(t => { 
			return { 
				token: t.split('/')[0], 
				tag: t.split('/')[1] 
			} 
		});
}

function sentFromTaggedSent(taggedSentence) {
	return taggedSentence
		// .split(' ')
		.split(/(?<=\/\S+) /g) // allows for words with spaces
		.map(t => t.split('/')[0]).join(' ');
}

function sentFromTagged(tagged) {
	return tagged.map(t => `${t.token}`).join(' ');
}

function getTags(tagged) {
	return tagged.map(t => t.tag);
}

// grammar utils 
function addTaggedWordsToGrammar(tagged, grammar) {
	for (let k = 0; k < tagged.length; k++) {
		let { token, tag } = tagged[k];
		if (token === 'XX' || tag === 'XX') continue; // words to not save
		if (tag[0] === '@') continue; // repeated words 
		if (token === tag) continue; // don't save things like '.': '.' -- still in sents
		if (!tag.includes('NNP') || token === 'I') token = token.toLowerCase();
		if (token.match(/Mr\.\w+/)) token = token.replace(/Mr\./, 'Mr. ');
		if (token.includes('_')) token = token.replace('_', ' '); // add underscore for two part words
		if (tag === 'Q') console.log(tag, token, grammar[tag], !grammar[tag])
		if (!grammar[tag]) grammar[tag] = [];
		if (!grammar[tag].flatMap(t => t).includes(token)) grammar[tag].push([token]);
	}
	// return grammar;
}

// sequence of tags -- this is like a setnence ??
function addTagsToGrammar(tagged, grammar, unique) {
	let punc = tagged[tagged.length - 1].token;
	let type = 'S';
	if (punc === '?') type = 'Q';
	if (punc === '!') type = 'E';
	if (!'.?!'.includes(punc)) {
		type = 'F';
		// tagged.pop();
		// tagged.push({ token: '.', tag: '.' });
	}

	let tags = getTags(tagged);
	// this is prob off, just want to remove 
	// if (tags.includes('XX')) return;
	// remove 

	if (unique) {
		if (grammar[type].map(seq => seq.join(' ')).includes(tags.join(' '))) {
			return;
		}
	}
	
	grammar[type].push(tags);
}

function createGrammar() {
	return { S: [], Q: [], E: [], F: [] };
}

module.exports = {
	formatLine,
	formatSents,
	formatSent,
	combineNNP,
	replacePOS,
	formatPunc,
	taggedSentFromTagged,
	taggedFromTaggedSent,
	getTags,
	sentFromTaggedSent,
	sentFromTagged,
	addTaggedWordsToGrammar,
	addTagsToGrammar,
	createGrammar,
};