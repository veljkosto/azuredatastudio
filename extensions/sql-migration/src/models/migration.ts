/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { azureResource } from 'azureResource';


export class Migrations {
	private static context: vscode.ExtensionContext;
	private static mementoToken: string = 'databaseMigrations';

	public static setExtensionContext(context: vscode.ExtensionContext): void {
		Migrations.context = context;
	}

	public static getMigrations(connectionId: string): azureResource.DatabaseMigration[] {

		let dataBaseMigrations: azureResource.DatabaseMigration[] = [];

		try {
			const migrationMementos: MigrationContext[] = this.context.globalState.get(this.mementoToken) || [];

			dataBaseMigrations = migrationMementos.filter((memento) => {
				return memento.connectionId === connectionId;
			}).map((memento) => {
				return memento.migration;
			});
		} catch (e) {
			console.log(e);
		}

		return dataBaseMigrations;
	}

	public static saveMigration(connectionId: string, migration: azureResource.DatabaseMigration): void {
		try {
			const migrationMementos: MigrationContext[] = this.context.globalState.get(this.mementoToken) || [];
			migrationMementos.push({
				connectionId: connectionId,
				migration: migration
			});
			this.context.globalState.update(this.mementoToken, migrationMementos);
		} catch (e) {
			console.log(e);
		}
	}
}

export interface MigrationContext {
	connectionId: string,
	migration: azureResource.DatabaseMigration
}
