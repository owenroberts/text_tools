Notes on using text tools.

General approach
- Texts are different, review text before accepting basic approach of scripts
- Review changes as they occur
- Goal is a usable, not complete grammar, don't be too precious

Creating a context free grammar from a text
- Start with prepping the text, may need to be different depending on source
	- *gutenberg-prep.js* is a good place to start, it removes the line breaks, all-caps titles and footnotes, diacritics
- Use *sacred-scrape.js* to scrape files from sacred-texts.com, or possibly other sites
	- prep may or may not be necessary
- Tag the corpus with *corpus-tagger.js*, this uses a basic pos tagger and has prompts to edit and change mistakes, or run without edits
	- Use the *-prepped.txt* file
	- Once -tagged file is created that's the main source for creating grammars, should be treated as the grammar bible
	- Edit -tagged while filling it out and start over from where you were
	- Takes about half hour for 100 sentences
	- Sent tokenizer doesn't work with abbreviations, ie St. John or H. P. Blavatsky, have to go back and fix
	- Manually edit mistakes out of corpus and run *save-grammar.js* to renew the CFG
		- Double /NNP --> (?<=[\w+])\/NNP (?=\w+\/NNP)
		- numbers separated by ,
		- numbers like a hundred and a thousand, a hundred/CD
		- abbreviations like Mr., Dr. H. P. Blavatsky
- Generate a CFG with *save-grammar.js* (corpus-tagger will do this as well, but it can be run again on the existing tagged file)
	- first arg is the file, second is max length of a sentence save to SQEF
- Run tests with *test-sentences.js* and choose sentences to keep or not in sent grammar
	- easier if only saving shorter sentences to the grammar
	- this generates the pos and sent files
	- generator can use cfg, or pos + sent files
- *update-grammars.js*, update existing grammars with new chosen sent tags ...
- *replacements.js* has replacements to typically problematic words like I, you, it, etc that are not easy to replace correctly with a grammar, this will just use the words themselves
- *utils.js* has funcs for text tramsformation used by multiple modules

Things to look out for
- Separators are problematic, dashes, double dashes, em/en dashes, ellipses (three dots and character)