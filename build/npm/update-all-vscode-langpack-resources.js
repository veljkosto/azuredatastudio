/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * @param {string} location
 */
function updateGrammar(location) {
	const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
	const result = cp.spawnSync(npm, ['run', 'update-grammar'], {
		cwd: location,
		stdio: 'inherit'
	});

	if (result.error || result.status !== 0) {
		process.exit(1);
	}
}

const allLangPackFolders = fs.readdirSync('i18n');
const langpacks = allLangPackFolders.filter(e => {
	try {
		let packageJSON = JSON.parse(fs.readFileSync(path.join('i18n', e, 'package.json')).toString());
		return packageJSON && packageJSON.scripts && packageJSON.scripts['update-vscode-langpack-resources'];
	} catch (e) {
		return false;
	}
});

console.log(`Updating ${extensions.length} grammars...`);

extensions.forEach(extension => updateGrammar(`extensions/${extension}`));

// run integration tests

if (process.platform === 'win32') {
	cp.spawn('.\\scripts\\test-integration.bat', [], { env: process.env, stdio: 'inherit' });
} else {
	cp.spawn('/bin/bash', ['./scripts/test-integration.sh'], { env: process.env, stdio: 'inherit' });
}

