/*
	add a grammar and generate text
	also uses filters to add specific words or types of sentences
	tagChance - chance of including tag in filters
	filterChance - 
	removeChange - change of being removed from filter

*/

if (typeof module !== 'undefined') {
	const { coinFlip, choice, chance } = require('./cool.js');
	const { Markov } = require('./Markov.js');
}

function CFGGenerator(params) {

	if (!params) params = {};
	let { cfgFiles, tagChance, filterChance, removeChance, callback } = params;

	let grammars = {};
	let markovs = {};
	let overrides = {};
	let shareOverrides = params.shareOverrides !== undefined ? params.shareOverrides : true;
	let defaultTypes = 'SQEF';
	let defaultMarkovParams = { n: 3, max: 13 };

	let defaultSentenceType = params.defaultSentenceType || 'S';
	let useMarkov = params.useMarkov || false;

	let overrideAddTagChance = tagChance || 0.5; // chance tag is added when going through new sent
	let overrideFilterChance = filterChance || 0.5; // chance pos is added to filter for pos tags
	let overrideRemoveChance = removeChance || 0.5;

	// this is relative to each user
	let overridePosKeys = {}; 
	let overrideFilter = {};
	
	this.isReady = false;
	if (cfgFiles) {
		if (Object.keys(cfgFiles).length > 0) {
			loadGrammarFiles();
		}
	}

	async function loadGrammarFiles() {
		for (const f in cfgFiles) {
			const url = cfgFiles[f];
			const cfgData = await fetch(url).then(response => response.json());
			// grammars[f] = cfgData;
			this.feed(f, cfgData);
		}
		// if (callback) callback();
	}

	this.feed = function(gid, json) {
		if (!overrides[gid]) overrides[gid] = {};
		if (!grammars[gid]) grammars[gid] = {};
		if (!markovs[gid]) markovs[gid] = {};
		
		for (const k in json) {
			grammars[gid][k] = json[k];
			
			if (useMarkov && defaultTypes.includes(k)) {
				markovs[gid][k] = new Markov(defaultMarkovParams);
				for (let i = 0; i < json[k].length; i++) {
					let seq = [...json[k][i]];
					seq.pop(); // remove punc
					markovs[gid][k].feed(seq.join(' '));
				}
			}
		}

		if (!overridePosKeys[gid]) overridePosKeys[gid] = [];
		if (!overrideFilter[gid]) overrideFilter[gid] = [];
		overridePosKeys[gid] = overridePosKeys[gid]
			.concat(Object.keys(grammars[gid]).filter(k => k.length > 1));
		overrideFilter[gid] = overrideFilter[gid]
			.concat(overridePosKeys[gid].filter(_ => chance(overrideFilterChance)));

		if (!this.isReady && Object.keys(grammars[gid]).length > 0) { 
			this.isReady = true;
			if (callback) callback();
		}
	}

	function expand(gid, start, expansion, override, filter, prev) {
		if (override[start]) {
			if (override[start].length > 0) {
				let pick = choice(override[start]);
				if (Array.isArray(pick)) {
					for (let i = 0; i < pick.length; i++) {
						expand(gid, pick[i], expansion, override, filter, start);
					}
				} else {
					if (start === '@&') console.log('@&', pick);
					expansion.push({ word: pick, pos: start });
					// remove to avoid doubles (optional?)
					// console.log('ex', override[start])
					override[start].splice(override[start].indexOf(pick), 1);
				}
				return expansion;
			}
		}
		if (grammars[gid][start]) {
			// if there's a filter, filter options to include POS in filter
			let picks = filter[start] ? 
				grammars[gid][start].filter(p => p.includes(filter[start])):
				grammars[gid][start];
			let pick;
			if (picks.length === 0) {
				pick = choice(grammars[gid][start]);
			} else {
				pick = choice(picks);
			}
			// if (defaultTypes.includes(start)) console.log(pick.join(' '));
			for (let i = 0; i < pick.length; i++){
				expand(gid, pick[i], expansion, override, filter, start);
			}
		} else {
			// prev is the prev pos, added to accomodate filters and overrides
			// console.log('start', start, 'prev', prev, 'ex', expansion);
			let word = start;
			let pos = prev;
			if (start === '@&') word = expansion[expansion.length - 1].word;
			if (start[0] === '@') {
				pos = start.substring(1);
				for (let i = expansion.length - 1; i >= 0; i--) {
					if (expansion[i].pos === pos) {
						word = expansion[i].word;
						break;
					}
				}
			}
			expansion.push({ word: word, pos: pos });
		}
		return expansion;
	}

	function formatSentence(expansion) {
		let text = expansion.map(e => e.word).join(' ');
		text = text.replace(/\s+(?=[.?!,—])/g, ''); // remove trailing spaces
		// text = text.replace(/^\s+/, ''); // remove beginning spaces
		text = text.replace(/\ba (?=[aeiou])/gi, 'an '); // replace a's with an's
		text = text.replace(/\ban (?![aeiou])/gi, 'a '); // replace an's w a's
		// text = text.replace(/ \' /g, '\''); // remove spaces from of '
		text = text.replace(/\bi\b/g, 'I'); // capitalize i
		text = text.replace(/\s\'s'/g, "'s"); // remove space from NNP 's
		text = text[0].toUpperCase() + text.substring(1, text.length); // capitalize first letter

		// capitalize after punctuation
		let puncs = text.match(/[\.\?\!]\s[a-z]/g);
		if (puncs) {
			puncs.forEach(m => {
				let r = m.substring(0, m.length - 1) + m[m.length - 1].toUpperCase();
				text = text.replace(m, r);
			});
		}

		return text;
	}

	this.addOverrides = function(gid, tags, tagChance) {
		
		if (!overrides[gid]) { // usually not the case 
			overrides[gid] = {};
			overridePosKeys[gid] = Object.keys(grammars[gid]).filter(k => k.length > 1);
			overrideFilter[gid] = overridePosKeys[gid].filter(_ => chance(overrideFilterChance));
		}

		const gids = shareOverrides ? Object.keys(grammars) : [gid];
		// do here or in getSentence??

		for (let i = 0; i < gids.length; i++) {
			const g = gids[i];
			for (let i = 0; i < tags.length - 1; i++) {
				if (!chance(tagChance || 0)) continue;
				const { pos, word } = tags[i];
				if (!overrideFilter[g].includes(pos)) continue;
				if (!overrides[g][pos]) overrides[g][pos] = [];
				if (!overrides[g][pos].includes(word)) {
					overrides[g][pos].push(word);
				}
			}
		}
	};

	// by gid or not ....
	this.updateOverrides = function(gid, removeChance) {
		// randomly remove pos from overrides
		for (const pos in overrides[gid]) {
			if (chance(removeChance)) {
				overrides[gid][pos].shift();
			}
		}
		// update filter
		if (chance(removeChance)) overrideFilter[gid].shift();
		if (chance(removeChance)) overrideFilter[gid].push(choice(overridePosKeys[gid].filter(pos => !overrideFilter[gid].includes(pos))));
	};

	// for testing ... 
	this.clearOverrides = function() {
		for (const gid in overrides) {
			overrides[gid] = {};
		}
	};

	// gid = grammar Id, st = sentence type (SQEF)
	// add override - add words to override filter
	this.getSentence = function(gid, st, addOverrides, filter) {
		let over = { ...overrides[gid] };
		if (useMarkov) over[st] = [[...markovs[gid][st].getSequence().split(' '), '.']]; ;
		let sent = this.getText(gid, st, over, filter);
		if (addOverrides) {
			this.addOverrides(gid, sent.tags, overrideAddTagChance);
			this.updateOverrides(gid, overrideRemoveChance);
		}
		return sent.text;
	};

	// filter prefers sequences containing pos in filter
	this.getText = function(gid, st, override, filter) {
		let sentenceType = st || defaultSentenceType;
		if (typeof override === 'string') override = JSON.parse(override);
		if (!override[st]) {
			if (!grammars[gid][st]) st = 'S';
			if (!grammars[gid][st].length) st = 'S';
		}
		let result = expand(gid, st, [], override || {}, filter || {});
		// maybe can add tags directly to filter here ... 
		return { text: formatSentence(result), tags: result };
	};
}

if (typeof module !== 'undefined') {
	module.exports = { CFGGenerator };
}
