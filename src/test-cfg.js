const { CFGGenerator } = require('./CFGGenerator.js');
const fs = require('fs');
const program = require('commander');
program.version('0.0.1')
	.usage('<word>')
	.parse(process.argv);

const file = program.args[0];
const n = program.args[1] || 10;
const gen = new CFGGenerator({
	useMarkov: true,
});
gen.feed('test', JSON.parse(fs.readFileSync(file)));

for (let i = 0; i < n; i++) {
	const st = choice('SQEF'.split(''));
	console.log(i, st, gen.getSentence('test', st));
}