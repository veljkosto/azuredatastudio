/* eslint-disable no-sync */
/* eslint-disable no-console */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as readdirp from 'readdirp';
import * as fs from 'fs';
import * as assert from 'assert';
// import * as marked from 'sql/base/common/marked/marked';
import * as vsMarked from 'vs/base/common/marked/marked';
// import * as notebookMarkdown from '../../browser/outputs/notebookMarkdown';
import { LocalContentManager } from 'sql/workbench/services/notebook/common/localContentManager';
import { CellTypes } from 'sql/workbench/services/notebook/common/contracts';
import { NotebookMarkdownRenderer } from 'sql/workbench/contrib/notebook/browser/outputs/notebookMarkdown';
import * as path from 'path';
import { loremIpsum } from 'lorem-ipsum';

type AllIssues = { [key: string]: NotebookIssues };
type NotebookIssues = { nbGuid: string, spaceDifferences: number, issues: CellIssue[] };
// Note - we use single character names here so that it's easier to do side-by-side comparison (the exact names don't matter much, we just want them to be the same length)
type CellIssue = {
	cellGuid: string, // The guid of the cell
	o: string, // original text
	m: string, // modified lorem-ipsum-ified text
	s: string, // original sql parse result
	v: string, // original vs parse result
	ms: string, // modified sql parse result
	mv: string
}; // modified vs parse result

let generatedTestIndex = 1;

/**
 * Steps I do currently to create tests :
 *
 * 1. Take set of notebooks and put in nbDir folder
 * 2. Run "compare text cells in all notebooks in directory" test
 * 		.\scripts\test.bat -g "compare text cells in all notebooks in directory"
 * 3. Go through notebookDifferences.json and for each issue :
 * 		a. Do a side-by-side comparison of the s and v values until you find a difference
 * 		b. From that take the snippet of code from the o value that corresponds to the part that changed
 * 		c. Copy that into the "compare marked.js" test below
 * 		d. Run the "compare marked.js" test
 *		e. Verify that the test fails - and that it fails with the same difference you saw in the original comparison
 * 		f. If it doesn't fail or fails for a different reason then try expanding the snippet - repeat this until you can repro the issue
 * 		g. Now go in and start trying to trim down the snippet - removing newlines, shortening and anonymizing text, etc.
 * 		h. Once you have it down to a simple test case then move it over to the notebookMarkdown.test.ts and add it to the end, pulling the "expected" value from the console.log the "compare marked.js" test generates
 */

const nbDir = '<INSERT PATH TO NOTEBOOK DIR HERE>';

suite('LivesiteRepo', function (): void {
	let contentManager = new LocalContentManager(undefined);
	let notebookMarkdownRenderer = new NotebookMarkdownRenderer();

	this.timeout('1000s');
	test('compare text cells in all notebooks in directory', async function (): Promise<void> {
		const allIssues: AllIssues = {};


		// Get contents of every text cell in each notebook to check for issues...
		for await (const entry of readdirp(nbDir, { fileFilter: '*.ipynb' })) {
			const { fullPath } = entry;
			// console.log(`Current notebook: ${JSON.stringify({ path })}`);
			let notebook = await contentManager.loadFromContentString(fs.readFileSync(fullPath).toString());
			if (notebook.cells?.length) {
				// console.log(`Found ${notebook.cells.length} cells total`);
				const textCells = notebook.cells.filter(c => c.cell_type === CellTypes.Markdown);
				// console.log(`Found ${textCells.length} text cells`);
				textCells.forEach((cell, index) => {
					const cellSource = typeof cell.source === 'string' ? cell.source : cell.source.join('\n');
					const result = testMarked(cellSource);
					try {
						assert.strictEqual(result.sqlResult, result.vsCodeResult);
					} catch (ex) {
						// The assert failed so log that this cell failed
						const relativePath = path.relative(nbDir, fullPath);
						if (allIssues[relativePath] === undefined) {
							allIssues[relativePath] = { nbGuid: notebook.metadata['azdata_notebook_guid'], issues: [], spaceDifferences: 0 };
						}
						if (ex?.toString()?.includes('Lines skipped')) {
							// Ignore space-only differences
							allIssues[relativePath].spaceDifferences++;
						} else {
							// Create a modified version of the string that replaces words with randomly gemerated lorem-ipsum words.
							// Note that currently this isn't really needed - it was originally made as a way to automatically generate tests
							// that we could check in as the raw content from the livesite books wasn't something we could get in directly.
							// But this ended up being difficult to do correctly and the cell contents were so long that I ended up just manually
							// searching the differences and pulling out smaller snippets of code that demonstrated the issues in the cell and at
							// that point it was easier to just manually change the strings as needed
							let modified = result.originalText.replace(/(\w+)/g, value => {
								// Ignore words that are extremely short or are reserved words that we want to keep because they are HTML/markdown keywords
								if (value.length > 2 && ['https', 'href', 'com', 'span', 'styling', 'net', 'style', 'font', 'size', 'Calibri', '0pt'].indexOf(value) === -1) {
									return loremIpsum({ count: 1, units: 'word' });
								}
								return value;
							});
							const modifiedResult = testMarked(modified);
							allIssues[relativePath].issues.push({ cellGuid: cell.metadata?.azdata_cell_guid ?? index.toString(), o: result.originalText, m: modified, s: result.sqlResult, v: result.vsCodeResult, ms: modifiedResult.sqlResult, mv: modifiedResult.vsCodeResult });
							console.log(ex);
						}
					}
				});
			}
		}
		console.log(`${Object.values(allIssues).filter(notebookIssues => notebookIssues.issues.length > 0).length} notebooks have code differences`);
		console.log(`${Object.values(allIssues).filter(notebookIssues => notebookIssues.spaceDifferences > 0).length} notebooks have just spacing differences`);

		// Dump all the differences to a file for reviewing and easier side-by-side comparison
		fs.writeFileSync(path.join(nbDir, 'notebookDifferences.json'), JSON.stringify(allIssues, undefined, 2));

		// Generate the test function code - one for each difference
		const testCode = Object.values(allIssues).filter(notebookIssues => notebookIssues.issues.length > 0).map(nbIssues => {
			return nbIssues.issues.map(issue =>
				`test('${generatedTestIndex++}', function (): void {
	const markdown = \`${escapeCharacters(issue.m)}\`;
	const expectedValue = \`${escapeCharacters(issue.ms)}\`;
	const result = notebookMarkdownRenderer.renderMarkdown({ value: markdown, isTrusted: true }).innerHTML;
	assert.strictEqual(result, expectedValue);
});`).join('\n\n');
		}).join('\n\n');
		fs.writeFileSync(path.join(nbDir, 'testCode.txt'), testCode);
	});

	/**
	 * This test is for checking whether there are any differences in the generated output for a given markdown string between
	 * the two versions of marked.js.
	 */
	const result = testMarked(''); // test markdown string goes here
	test('compare marked.js', () => {
		console.log(escapeCharacters(result.sqlResult)); // This outputs the escaped value from the sql marked.js parser - which should be used as the expected baseline value in actual tests
		assert.strictEqual(result.sqlResult, result.vsCodeResult);
	});


	/**
	 * Runs the given markdown string through both the SQL and VS versions of the marked.js parser and returns the result
	 * @param markdown The markdown string to test
	 * @returns
	 */
	function testMarked(markdown: string): { originalText: string, sqlResult: string, vsCodeResult: string } {
		let s = notebookMarkdownRenderer.renderMarkdown({ value: markdown, isTrusted: true }).innerHTML;
		let v = notebookMarkdownRenderer.renderMarkdown({ value: markdown, isTrusted: true },
			undefined,
			opts => new vsMarked.Renderer(opts),
			(src, options, callback) => vsMarked.parse(src, options, callback)).innerHTML;
		return { originalText: markdown, sqlResult: s, vsCodeResult: v };
	}
});

/**
 * Escapes the set of characters for writing to a file/printing to console so that they are handled correctly
 */
function escapeCharacters(value: string): string {
	return value.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}


