/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as mssql from '../mssql';
import { AppContext } from '../appContext';
import { SqlOpsDataClient, ISqlOpsFeature } from 'dataprotocol-client';
import { ClientCapabilities } from 'vscode-languageclient';
import * as constants from '../constants';
import * as contracts from '../contracts';
import { ResultStatus } from 'azdata';

export class SqlMigrationService implements mssql.ISqlMigrationService {
	public static asFeature(context: AppContext): ISqlOpsFeature {
		return class extends SqlMigrationService {
			constructor(client: SqlOpsDataClient) {
				super(context, client);
			}

			fillClientCapabilities(capabilities: ClientCapabilities): void {
			}

			initialize(): void {
			}
		};
	}

	private constructor(context: AppContext, protected readonly client: SqlOpsDataClient) {
		context.registerService(constants.SqlMigrationService, this);
	}

	async getAssessments(ownerUri: string): Promise<mssql.SqlMigrationAssessmentResult | undefined> {
		let params: contracts.SqlMigrationAssessmentParams = { ownerUri: ownerUri };
		try {
			return this.client.sendRequest(contracts.GetSqlMigrationAssessmentItemsRequest.type, params);
		}
		catch (e) {
			this.client.logFailedRequest(contracts.GetSqlMigrationAssessmentItemsRequest.type, e);
		}

		return undefined;
	}

	async validateWindowsCredentials(username: string, password: string): Promise<ResultStatus> {
		let params: contracts.SqlMigrationValidateWindowsCredentialsParams = { username: username, password: password };
		try {
			return this.client.sendRequest(contracts.SqlMigrationValidateWindowsCredentialsRequest.type, params);
		}
		catch (e) {
			this.client.logFailedRequest(contracts.SqlMigrationValidateWindowsCredentialsRequest.type, e);
		}

		return undefined;
	}

	async validateNetworkShare(path: string, username: string, password: string): Promise<ResultStatus> {
		let params: contracts.SqlMigrationValidateNetworkShareParams = { path: path, username: username, password: password };
		try {
			return this.client.sendRequest(contracts.SqlMigrationValidateNetworkShareRequest.type, params);
		}
		catch (e) {
			this.client.logFailedRequest(contracts.SqlMigrationValidateNetworkShareRequest.type, e);
		}

		return undefined;
	}
}
