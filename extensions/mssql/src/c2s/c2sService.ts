/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as mssql from 'mssql';
import { SqlOpsDataClient } from 'dataprotocol-client';
import * as contracts from '../contracts';

export class C2sService implements mssql.IC2sService {

	public constructor(protected readonly client: SqlOpsDataClient) { }

	public async C2sTest(testParam: string): Promise<mssql.C2sTestResponse> {
		const params: contracts.C2sTestParams = { testParam };
		return this.client.sendRequest(contracts.C2sTestRequest.type, params).then((value) => {
			return Promise.resolve(value);
		},
			e => {
				this.client.logFailedRequest(contracts.C2sTestRequest.type, e);
				return Promise.resolve(undefined);
			}
		);
	}

	public async GetSigningCertificate(): Promise<mssql.GetSigningCertficateResponse> {
		const params: contracts.GetSigningCertificateParams = {};
		return this.client.sendRequest(contracts.GetSigningCertificateRequest.type, params).then((value) => {
			return Promise.resolve(value);
		},
			e => {
				console.log('Greska: ' + e);
				this.client.logFailedRequest(contracts.GetSigningCertificateRequest.type, e);
				return Promise.resolve(undefined);
			}
		);
	}

	public async Save(savePath: string, connectionParams: { [name: string]: any }, shouldSignFile: boolean, signingCertificate: string, passwordEncryptionOption: string, encryptionCertificatePath: string): Promise<mssql.SaveResponse> {
		const params: contracts.SaveParams = { savePath, connectionParams, shouldSignFile, signingCertificate, passwordEncryptionOption, encryptionCertificatePath };
		return this.client.sendRequest(contracts.SaveRequest.type, params).then((value) => {
			return Promise.resolve(value);
		},
			e => {
				console.log('Greska: ' + e);
				this.client.logFailedRequest(contracts.SaveRequest.type, e);
				return Promise.resolve(undefined);
			});
	}

	public async Open(openPath: string): Promise<mssql.OpenResponse> {
		const params: contracts.OpenParams = { openPath };
		return this.client.sendRequest(contracts.OpenRequest.type, params).then((value) => {
			return Promise.resolve(value);
		},
			e => {
				console.log('Greska: ' + e);
				this.client.logFailedRequest(contracts.OpenRequest.type, e);
				return Promise.resolve(undefined);
			});
	}

	public async ShowSigningCertificate(signingCertificate: string): Promise<mssql.ShowSigningCertficateResponse> {
		const params: contracts.ShowSigningCertificateParams = { signingCertificate };
		return this.client.sendRequest(contracts.ShowSigningCertificateRequest.type, params).then((value) => {
			return Promise.resolve(value);
		},
			e => {
				console.log('Greska: ' + e);
				this.client.logFailedRequest(contracts.ShowSigningCertificateRequest.type, e);
				return Promise.resolve(undefined);
			});
	}
}
