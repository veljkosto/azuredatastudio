/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

let i18n = require("../lib/i18n");

let fs = require("fs");
let path = require("path");

let gulp = require('gulp');
let vfs = require("vinyl-fs");
let rimraf = require('rimraf');
let minimist = require('minimist');

const nonADSJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../excludedExtensions/nonADSExtensions.json'), 'utf8'));
const nonADSExtensions = nonADSJson.nonADSExtensions;
const textFields = {
	"nameText": 'ads',
	"displayNameText": 'Azure Data Studio',
	"publisherText": 'Microsoft',
	"licenseText": 'SEE SOURCE EULA LICENSE IN LICENSE.txt'
}

function update(options) {
	let idOrPath = options._;
	if (!idOrPath) {
		throw new Error('Argument must be the location of the localization extension.');
	}
	let location = options.location;
	if (location !== undefined && !fs.existsSync(location)) {
		throw new Error(`${location} doesn't exist.`);
	}
	let locExtFolder = idOrPath;
	if (/^\w{2}(-\w+)?$/.test(idOrPath)) {
		locExtFolder = path.join('.', 'i18n', `vscode-language-pack-${idOrPath}`);
	}
	let locExtStat = fs.statSync(locExtFolder);
	if (!locExtStat || !locExtStat.isDirectory) {
		throw new Error('No directory found at ' + idOrPath);
	}
	let packageJSON = JSON.parse(fs.readFileSync(path.join(locExtFolder, 'package.json')).toString());
	//processing extension fields, version and folder name must be changed manually.
	packageJSON['name'] = packageJSON['name'].replace('vscode', textFields.nameText);
	packageJSON['displayName'] = packageJSON['displayName'].replace('Visual Studio Code', textFields.displayNameText);
	packageJSON['publisher'] = textFields.publisherText;
	packageJSON['license'] = textFields.licenseText;

	let contributes = packageJSON['contributes'];
	if (!contributes) {
		throw new Error('The extension must define a "localizations" contribution in the "package.json"');
	}
	let localizations = contributes['localizations'];
	if (!localizations) {
		throw new Error('The extension must define a "localizations" contribution of type array in the "package.json"');
	}

	localizations.forEach(function (localization) {
		if (!localization.languageId || !localization.languageName || !localization.localizedLanguageName) {
			throw new Error('Each localization contribution must define "languageId", "languageName" and "localizedLanguageName" properties.');
		}
		let languageId = localization.transifexId || localization.languageId;
		let translationDataFolder = path.join(locExtFolder, 'translations');
		if (languageId === "zh-cn") {
			languageId = "zh-hans";
		}
		if (languageId === "zh-tw") {
			languageId = "zh-hant";
		}

		if (fs.existsSync(translationDataFolder)) {
			for (let extensionName in nonADSExtensions) {
				let filePath = path.join(translationDataFolder, 'extensions', nonADSExtensions[extensionName] + '.i18n.json')
				console.log('Clearing  \'' + filePath + '\' as it does not exist in ADS');
				rimraf.sync(filePath);
			}
		}


		console.log(`Importing translations for ${languageId} form '${location}' to '${translationDataFolder}' ...`);
		let translationPaths = [];
		gulp.src(path.join(location, languageId, '**', '*.xlf'))
			.pipe(i18n.modifyI18nPackFiles(translationDataFolder, i18n.externalExtensionsWithTranslations, translationPaths, languageId === 'ps'))
			.on('error', (error) => {
				console.log(`Error occurred while importing translations:`);
				translationPaths = undefined;
				if (Array.isArray(error)) {
					error.forEach(console.log);
				} else if (error) {
					console.log(error);
				} else {
					console.log('Unknown error');
				}
			})
			.pipe(vfs.dest(translationDataFolder))
			.on('end', function () {
				if (translationPaths !== undefined) {
					let nonExistantExtensions = [];
					for (let curr of localization.translations) {
						try {
							fs.statSync(path.join(translationDataFolder, curr.path.replace('./translations', '')));
						}
						catch {
							console.log('Non existent extension ' + curr.path + ' detected, removing from manifest');
							nonExistantExtensions.push(curr);
						}
					}
					for (let nonExt of nonExistantExtensions) {
						let index = localization.translations.indexOf(nonExt);
						if (index > -1) {
							localization.translations.splice(index, 1);
						}
					}
					for (let tp of translationPaths) {
						localization.translations.push({ id: tp.id, path: `./translations/${tp.resourceName}` });
					}
					fs.writeFileSync(path.join(locExtFolder, 'package.json'), JSON.stringify(packageJSON, null, '\t'));
				}
			});

	});
}
if (path.basename(process.argv[1]) === 'convert-langpack-extension.js') {
	var options = minimist(process.argv.slice(2), {
		string: 'location'
	});
	update(options);
}
