/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import { WizardController } from './wizard/wizardController';
import { DashboardWidget } from './dashboard/dashboardPage';
import { IconPathHelper } from './constants';
import { Migrations } from './models/migration';
import * as path from 'path';
import * as fs from 'fs';
class SQLMigration {

	constructor(private readonly context: vscode.ExtensionContext) {
		IconPathHelper.setExtensionContext(context);
		Migrations.setExtensionContext(context);
	}

	async start(): Promise<void> {
		await this.registerCommands();
	}

	async registerCommands(): Promise<void> {
		const commandDisposables: vscode.Disposable[] = [ // Array of disposables returned by registerCommand
			vscode.commands.registerCommand('sqlmigration.start', async () => {
				let activeConnection = await azdata.connection.getCurrentConnection();
				let connectionId: string = '';
				if (!activeConnection) {
					const connection = await azdata.connection.openConnectionDialog();
					if (connection) {
						connectionId = connection.connectionId;
					}
				} else {
					connectionId = activeConnection.connectionId;
				}
				const wizardController = new WizardController(this.context);
				await wizardController.openWizard(connectionId);
			}),
		];

		azdata.tasks.registerTask('sqlmigration.start', async () => {
			let activeConnection = await azdata.connection.getCurrentConnection();
			let connectionId: string = '';
			if (!activeConnection) {
				const connection = await azdata.connection.openConnectionDialog();
				if (connection) {
					connectionId = connection.connectionId;
				}
			} else {
				connectionId = activeConnection.connectionId;
			}
			const wizardController = new WizardController(this.context);
			await wizardController.openWizard(connectionId);
		});

		azdata.tasks.registerTask('sqlmigration.notebooks', async () => {
			const input = vscode.window.createQuickPick<vscodeQuickPickItems>();
			input.placeholder = 'Types to search for notebooks';

			input.items = [
				{
					label: '1. Inline Migration Notebook',
					notebook: vscode.Uri.parse(path.join(this.context.extensionPath, 'notebooks', 'Inline_Migration_ADS_Notebook.ipynb'))
				}
			];

			input.onDidAccept(async (e) => {
				const item = input.selectedItems[0].notebook;
				const content = fs.readFileSync(item.fsPath).toString();
				const uri: vscode.Uri = vscode.Uri.parse(`untitled: Inline Migration Notebook`);
				azdata.nb.showNotebookDocument(uri, {
					connectionProfile: undefined,
					preview: false,
					initialContent: content,
					initialDirtyState: true
				});

				input.hide();
			});

			input.show();
		});

		this.context.subscriptions.push(...commandDisposables);
	}

	stop(): void {

	}
}

let sqlMigration: SQLMigration;
export async function activate(context: vscode.ExtensionContext) {
	sqlMigration = new SQLMigration(context);
	await sqlMigration.registerCommands();

	let rootPath: string = context.extensionPath;
	let widget = new DashboardWidget(rootPath);
	widget.register();
}

export function deactivate(): void {
	sqlMigration.stop();
}

interface vscodeQuickPickItems {
	label: string,
	notebook: vscode.Uri
}
