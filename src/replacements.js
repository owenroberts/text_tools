/*
	replace commonly problematic pos
	add or remove
*/

const replacements = {
	tokens: [
		'I', 'i', 'me', 'we', 'us', 'you', 'thou', 'thee', 'they', 'them', 'myself', 'yourself', 'ourselves', 'themselves', 'one another', 'each other', 'that', 'this', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'doing', 'did', 'another', 'all', 'any', 'enough', 'everything', 'nothing', 'something', '…', '—'
	],
	'tags': {
		'CD': {
			'CD1': ['one']
		},
		'PRP': {
			'PRPSS3': ['they', 'he', 'she', 'it', 'one', 'someone'],
			'PRPS*3': ['it', 'one', 'someone'],
			'PRPSO3': ['them', 'him', 'her', 'it', 'one', 'someone'],
			'PRPSR3': ['himself', 'herself', 'itself'],
			'PRP$AB': ['mine', 'yours', 'hers', 'ours', 'theirs'],
			'PRP$JJ': ['my', 'your', 'her', 'our', 'their'],
			'PRP$*': ['his', 'its', 'hers'],
			'PRP$S': ['s'],
			'PRPSC3': ['one another', 'each other'],
		},
		'DT': {
			'DTCS': ['every', 'neither', 'each', 'every', 'a', 'an', 'either', 'one'],
			'DTUS': ['little', 'much', 'less', 'least'],
			'DT*P': ['these', 'those'],
			'DTCP': ['both', 'many', 'few', 'several', 'these', 'those'],
			'DT': ['the', 'some', 'such', 'no'],
		},
		'IN': {
			'IF': ['if', 'whether']
		}
	}
};

module.exports = { replacements };