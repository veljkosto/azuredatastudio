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



suite('LivesiteRepo', function (): void {
	let contentManager = new LocalContentManager(undefined);
	let notebookMarkdownRenderer = new NotebookMarkdownRenderer();

	this.timeout('1000s');
	test('compare text cells in all notebooks in directory', async function (): Promise<void> {

		const nbDir = '/Users/chlafren/ADS Livesite Support/';

		let numDiffs = 0;
		let spaceDiffs = 0;
		for await (const entry of readdirp(nbDir, { fileFilter: '*.ipynb' })) {
			const { fullPath } = entry;
			// console.log(`Current notebook: ${JSON.stringify({ path })}`);
			let notebook = await contentManager.loadFromContentString(fs.readFileSync(fullPath).toString());
			if (notebook.cells?.length) {
				// console.log(`Found ${notebook.cells.length} cells total`);
				const textCells = notebook.cells.filter(c => c.cell_type === CellTypes.Markdown);
				// console.log(`Found ${textCells.length} text cells`);
				textCells.forEach(cell => {
					try {
						if (typeof cell.source === 'string') {
							testMarked(cell.source);
						} else {
							const cellSource = cell.source.join('\n');
							testMarked(cellSource);
						}
					} catch (ex) {
						if (ex?.toString()?.includes('Lines skipped')) {
							spaceDiffs++;
						} else {
							console.log(ex);
							numDiffs++;
						}
					}
				});
			}
		}
		console.log(`${numDiffs} notebooks are different`);
		console.log(`${spaceDiffs} notebooks are different (spacing only)`);
	});
	function testMarked(markdown: string): void {
		let sqlResult: HTMLElement = notebookMarkdownRenderer.renderMarkdown({ value: markdown, isTrusted: true });
		let vsResult: HTMLElement = notebookMarkdownRenderer.renderMarkdown({ value: markdown, isTrusted: true },
			undefined,
			opts => new vsMarked.Renderer(opts),
			(src, options, callback) => vsMarked.parse(src, options, callback));
		assert.strictEqual(sqlResult.innerHTML, vsResult.innerHTML);
	}
});


