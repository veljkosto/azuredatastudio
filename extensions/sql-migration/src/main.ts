/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as mssql from '../../mssql';
import { promises as fs } from 'fs';
import * as loc from './constants/strings';
import { MigrationNotebookInfo, NotebookPathHelper } from './constants/notebookPathHelper';
import { IconPathHelper } from './constants/iconPathHelper';
import { DashboardWidget } from './dashboard/sqlServerDashboard';
import { MigrationLocalStorage } from './models/migrationLocalStorage';
import { MigrationStateModel, SavedInfo } from './models/stateMachine';
import { SavedAssessmentDialog } from './dialog/assessmentResults/savedAssessmentDialog';

class SQLMigration {

	constructor(private readonly context: vscode.ExtensionContext) {
		NotebookPathHelper.setExtensionContext(context);
		IconPathHelper.setExtensionContext(context);
		MigrationLocalStorage.setExtensionContext(context);
	}

	async start(): Promise<void> {
		await this.registerCommands();
	}

	async registerCommands(): Promise<void> {
		const commandDisposables: vscode.Disposable[] = [ // Array of disposables returned by registerCommand
			vscode.commands.registerCommand('sqlmigration.start', async () => {
				await this.launchMigrationWizard();
			}),
			vscode.commands.registerCommand('sqlmigration.openNotebooks', async () => {
				const input = vscode.window.createQuickPick<MigrationNotebookInfo>();
				input.placeholder = loc.NOTEBOOK_QUICK_PICK_PLACEHOLDER;

				input.items = NotebookPathHelper.getAllMigrationNotebooks();

				input.onDidAccept(async (e) => {
					const selectedNotebook = input.selectedItems[0];
					if (selectedNotebook) {
						try {
							azdata.nb.showNotebookDocument(vscode.Uri.parse(`untitled: ${selectedNotebook.label}`), {
								preview: false,
								initialContent: (await fs.readFile(selectedNotebook.notebookPath)).toString(),
								initialDirtyState: false
							});
						} catch (e) {
							vscode.window.showErrorMessage(`${loc.NOTEBOOK_OPEN_ERROR} - ${e.toString()}`);
						}
						input.hide();
					}
				});

				input.show();
			}),
			azdata.tasks.registerTask('sqlmigration.start', async () => {
				await this.launchMigrationWizard();
			})
		];

		this.context.subscriptions.push(...commandDisposables);
	}

	async launchMigrationWizard(): Promise<void> {
		let activeConnection = await azdata.connection.getCurrentConnection();
		let connectionId: string = '';
		let serverName: string = '';
		let stateModel: MigrationStateModel;
		if (!activeConnection) {
			const connection = await azdata.connection.openConnectionDialog();
			if (connection) {
				connectionId = connection.connectionId;
				serverName = connection.options.server;
			}
		} else {
			connectionId = activeConnection.connectionId;
			serverName = activeConnection.serverName;
		}
		if (serverName) {
			const api = (await vscode.extensions.getExtension(mssql.extension.name)?.activate()) as mssql.IExtension;
			if (api) {
				stateModel = new MigrationStateModel(this.context, connectionId, api.sqlMigration);
				this.context.subscriptions.push(stateModel);
				let savedAssessments = this.checkSavedAssessments(serverName);
				if (savedAssessments) {
					stateModel.savedAssessment = savedAssessments;
					let savedAssessmentDialog = new SavedAssessmentDialog(stateModel);
					await savedAssessmentDialog.openDialog();
				}
			}

		}



	}

	private checkSavedAssessments(serverName: string): SavedInfo | undefined {
		let savedAssessments: SavedInfo | undefined = this.context.globalState.get(`${loc.MEMENTO_STRING}.${serverName}`);
		if (savedAssessments) {
			return savedAssessments;
		} else {
			return;
		}
	}

	stop(): void {

	}
}

let sqlMigration: SQLMigration;
export async function activate(context: vscode.ExtensionContext) {
	sqlMigration = new SQLMigration(context);
	await sqlMigration.registerCommands();
	let widget = new DashboardWidget();
	widget.register();
}

export function deactivate(): void {
	sqlMigration.stop();
}
