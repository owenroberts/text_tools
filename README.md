Notes on using text tools.

General approach
- Texts are different, review text before accepting basic approach of scripts
- Review changes as they occur
- Goal is a usable, not complete grammar, don't be too precious

Creating a context free grammar from a text
- Start with prepping the text, may need to be different depending on source
- *gutenberg-prep.js* is a good place to start, it removes the line breaks, all-caps titles and footnotes
- Tag the corpus with *corpus-tagger.js*, this uses a basic pos tagger and has prompts to edit and change mistakes, or run without edits
- Generate a CFG with *save-grammar.js* (corpus-tagger will do this as well, but it can be run again on the existing tagged file)
- Run tests with *test-sentences.js* and choose sentences to keep or not in sent grammar, easier if only saving shorter sentences to the grammar, this generates the pos and sent CFG files used by the generator
- *update-grammars.js*, update existing grammars with new chosen sent tags ...
- *replacements.js* has replacements to typically problematic words like I, you, it, etc that are not easy to replace correctly with a grammar, this will just use the words themselves
- *utils.js* has funcs for text tramsformation used by multiple modules

Things to look out for
- Separators are problematic, dashes, double dashes, em/en dashes, ellipses (three dots and character)