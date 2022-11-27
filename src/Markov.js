if (typeof module !== 'undefined') {
	const { coinFlip, choice, chance } = require('./cool.js');
}

function Markov(params) {
	n = Number(params.n);
	max = Number(params.max);
	
	let ngrams = {};
	let beginnings = [];
	let byWord = true;

	function tokenize(text) {
		return text.split(/\s+/);
	}

	this.feed = function(text) {
		let tokens = tokenize(text);
		if (tokens.length < n) return false; // Discard this line if it's too short

		// Store the first ngram of this line
		let beginning = tokens.slice(0, n).join(' ');
		beginnings.push(beginning);

		// Now let's go through everything and create the dictionary
		for (let i = 0; i < tokens.length - n; i++) {
			let gram, next; // Current ngram and the next one

			gram = tokens.slice(i, i + n).join(' ');
			next = tokens[i + n];

			if (!ngrams.hasOwnProperty(gram)) ngrams[gram] = []; // Is this a new one?
			ngrams[gram].push(next); // Add to the list
		}
	}

	function generate() {

		// Get a random  beginning
		current = choice(beginnings); // not sure why this is not let
		let output = tokenize(current);

		// Generate a new token max number of times
		for (let i = 0; i < max; i++) {
			// console.log(i, max, current);
			if (ngrams.hasOwnProperty(current)) { // If this is a valid ngram
				let possibleNext = ngrams[current]; // What are all the possible next tokens
				// console.log(possibleNext)
				let next = choice(possibleNext); // Pick one randomly

				output.push(next);  // If by word store the answer in an array
					// lookup next with last ngram
				current = output.slice(output.length - n, output.length).join(' ') 

			} else {
				break;
			}
		}

		output = output.join(' ');
		return output;
	}

	this.getSequence = function() {
		return generate();
	};
}

if (typeof module !== 'undefined') {
	module.exports = { Markov };
}