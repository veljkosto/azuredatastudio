/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as vscode from 'vscode';
import * as mssql from '../../../mssql';
import { SKURecommendations } from './externalContract';
import { azureResource } from 'azureResource';
import { getSubscriptions, startDatabaseMigration } from '../api/azure';
import * as constants from '../models/strings';

export enum State {
	INIT,
	COLLECTING_SOURCE_INFO,
	COLLECTION_SOURCE_INFO_ERROR,
	TARGET_SELECTION,
	TARGET_SELECTION_ERROR,
	AZURE_SERVER_SELECTION,
	AZURE_SERVER_SELECTION_ERROR,
	AZURE_DB_BACKUP,
	AZURE_DB_BACKUP_ERROR,
	MIGRATION_AGENT_CREATION,
	MIGRATION_AGENT_SELECTION,
	MIGRATION_AGENT_ERROR,
	MIGRATION_START,
	NO_AZURE_SERVER,
	EXIT,
}

export enum MigrationCutover {
	MANUAL,
	AUTOMATIC
}

export enum NetworkContainerType {
	FILE_SHARE,
	BLOB_CONTAINER,
	NETWORK_SHARE
}

export interface NetworkShare {
	networkShareLocation: string;
	windowsUser: string;
	password: string;
	storageSubscriptionId: string;
	storageAccountId: string;
	storageKey: string;
}

export interface BlobContainer {
	subscriptionId: string;
	storageAccountId: string;
	containerId: string;
}

export interface FileShare {
	subscriptionId: string;
	storageAccountId: string;
	fileShareId: string;
	resourceGroupId: string;
}
export interface DatabaseBackupModel {
	emailNotification: boolean;
	migrationCutover: MigrationCutover;
	networkContainerType: NetworkContainerType;
	networkContainer: NetworkShare | BlobContainer | FileShare;
	azureSecurityToken: string;
}
export interface Model {
	readonly sourceConnectionId: string;
	readonly currentState: State;
	gatheringInformationError: string | undefined;
	skuRecommendations: SKURecommendations | undefined;
	azureAccount: azdata.Account | undefined;
	databaseBackup: DatabaseBackupModel | undefined;
}

export interface StateChangeEvent {
	oldState: State;
	newState: State;
}

export class MigrationStateModel implements Model, vscode.Disposable {
	private _stateChangeEventEmitter = new vscode.EventEmitter<StateChangeEvent>();
	private _currentState: State;
	private _gatheringInformationError: string | undefined;
	private _skuRecommendations: SKURecommendations | undefined;
	private _assessmentResults: mssql.SqlMigrationAssessmentResultItem[] | undefined;
	private _azureAccount!: azdata.Account;
	private _databaseBackup!: DatabaseBackupModel;
	private _migrationController!: azureResource.MigrationController | undefined;
	private _subscriptions!: azureResource.AzureResourceSubscription[];
	public _subscriptionMap: Map<string, azureResource.AzureResourceSubscription>;
	public _targetSubscriptionId!: string;
	public _targetSQLMIServer!: string;
	public _nodeName!: string;

	constructor(
		private readonly _extensionContext: vscode.ExtensionContext,
		private readonly _sourceConnectionId: string,
		public readonly migrationService: mssql.ISqlMigrationService
	) {
		this._currentState = State.INIT;
		this.databaseBackup = {} as DatabaseBackupModel;
		this._subscriptionMap = new Map();
	}

	public get azureAccount(): azdata.Account {
		return this._azureAccount;
	}

	public set azureAccount(account: azdata.Account) {
		this._azureAccount = account;
	}

	public get databaseBackup(): DatabaseBackupModel {
		return this._databaseBackup;
	}

	public set databaseBackup(dbBackup: DatabaseBackupModel) {
		this._databaseBackup = dbBackup;
	}

	public get sourceConnectionId(): string {
		return this._sourceConnectionId;
	}

	public get currentState(): State {
		return this._currentState;
	}

	public set currentState(newState: State) {
		const oldState = this.currentState;

		this._currentState = newState;

		this._stateChangeEventEmitter.fire({ oldState, newState: this.currentState });
	}

	public get assessmentResults(): mssql.SqlMigrationAssessmentResultItem[] | undefined {
		return this._assessmentResults;
	}

	public set assessmentResults(assessmentResults: mssql.SqlMigrationAssessmentResultItem[] | undefined) {
		this._assessmentResults = assessmentResults;
	}

	public get gatheringInformationError(): string | undefined {
		return this._gatheringInformationError;
	}

	public set gatheringInformationError(error: string | undefined) {
		this._gatheringInformationError = error;
	}

	public get skuRecommendations(): SKURecommendations | undefined {
		return this._skuRecommendations;
	}

	public set skuRecommendations(recommendations: SKURecommendations | undefined) {
		this._skuRecommendations = recommendations;
	}

	public get stateChangeEvent(): vscode.Event<StateChangeEvent> {
		return this._stateChangeEventEmitter.event;
	}

	public set migrationController(controller: azureResource.MigrationController | undefined) {
		this._migrationController = controller;
	}

	public get migrationController(): azureResource.MigrationController | undefined {
		return this._migrationController;
	}

	public get subscriptions(): azureResource.AzureResourceSubscription[] {
		return this._subscriptions;
	}

	public set subscriptions(subscriptions: azureResource.AzureResourceSubscription[]) {
		this._subscriptions = subscriptions;
	}

	dispose() {
		this._stateChangeEventEmitter.dispose();
	}

	public getExtensionPath(): string {
		return this._extensionContext.extensionPath;
	}

	public async loadSubscriptions(): Promise<void> {
		if (this.azureAccount) {
			this._subscriptions = await getSubscriptions(this.azureAccount);
			this._subscriptions.forEach((subscription) => {
				this._subscriptionMap.set(subscription.id, subscription);
			});
		}
	}

	public getSubscriptionDropdownValue(): azdata.CategoryValue[] {
		let dropdownValues = this._subscriptions.map((subscription) => {
			return {
				name: subscription.id,
				displayName: subscription.name + ' - ' + subscription.id,
			};
		});

		if (!dropdownValues) {
			dropdownValues = [
				{
					displayName: constants.NO_SUBSCRIPTIONS_FOUND,
					name: ''
				}
			];
		}

		return dropdownValues;
	}

	public getSubscriptionName(id: string): string {
		return this._subscriptionMap.get(id)!.name;
	}

	public async startMigration() {
		await startDatabaseMigration(this.azureAccount, this._subscriptionMap());
	}
}
