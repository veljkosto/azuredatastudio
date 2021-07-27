/* eslint-disable no-sync */
/* eslint-disable no-console */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as readdirp from 'readdirp';
import * as fs from 'fs';
import { LocalContentManager } from 'sql/workbench/services/notebook/common/localContentManager';
import { CellTypes } from 'sql/workbench/services/notebook/common/contracts';



suite('LivesiteRepo', function (): void {
	let contentManager = new LocalContentManager(undefined);
	test('compare text cells in all notebooks in directory', async function (): Promise<void> {

		const nbDir = '/Users/chlafren/Desktop/Notebooks/';

		for await (const entry of readdirp(nbDir, { fileFilter: '*.ipynb' })) {
			const { path, fullPath } = entry;
			console.log(`Current notebook: ${JSON.stringify({ path })}`);
			let notebook = await contentManager.loadFromContentString(fs.readFileSync(fullPath).toString());
			if (notebook.cells?.length) {
				// console.log(`Found ${notebook.cells.length} cells total`);
				const textCells = notebook.cells.filter(c => c.cell_type === CellTypes.Markdown);
				// console.log(`Found ${textCells.length} text cells`);
				textCells.forEach(cell => {
					// console.log(cell.source);
				});
			}
		}
	});
});
