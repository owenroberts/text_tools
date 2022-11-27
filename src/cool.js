function coinFlip() {
	return Math.random() > 0.5;
}

function choice(choices) {
	if (!Array.isArray(choices)) choices = [...arguments];
	return choices[Math.floor(Math.random() * choices.length)];
}

function chance(n) {
	return Math.random(1) < n;
}

if (typeof module !== 'undefined') {
	module.exports = { coinFlip, choice, chance };
}