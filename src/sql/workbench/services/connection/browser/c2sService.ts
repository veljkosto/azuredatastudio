/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import * as mssql from 'mssql';
import { MainThreadC2s } from 'sql/workbench/api/browser/mainThreadC2s';

export class C2sService implements IC2sService {

	public _serviceBrand: undefined;
	private _proxy: MainThreadC2s;

	public testC2s(testParam: string): Promise<mssql.C2sTestResponse> {
		this.checkProxy();
		return Promise.resolve(this._proxy.testC2s(testParam));
	}

	public getSigningCertificate(): Promise<mssql.GetSigningCertficateResponse> {
		this.checkProxy();
		return Promise.resolve(this._proxy.getSigningCertificate());
	}

	public save(savePath: string, connectionParams: { [name: string]: any }, shouldSignFile: boolean, signingCertificate: string, passwordEncryptionOption: string, encryptionCertificatePath: string): Promise<mssql.SaveResponse> {
		this.checkProxy();
		Object.entries(connectionParams).forEach(([key, value]) => {
			if (value === undefined) {
				connectionParams[key] = '';
			}
		});
		return Promise.resolve(this._proxy.save(savePath, connectionParams, shouldSignFile, signingCertificate, passwordEncryptionOption, encryptionCertificatePath));
	}

	public open(openPath: string): Promise<mssql.OpenResponse> {
		this.checkProxy();
		return Promise.resolve(this._proxy.open(openPath));
	}

	public showSigningCertificate(signingCertificate: string): Promise<mssql.ShowSigningCertficateResponse> {
		this.checkProxy();
		return Promise.resolve(this._proxy.showSigningCertificate(signingCertificate));
	}

	public registerProxy(proxy: MainThreadC2s) {
		this._proxy = proxy;
	}

	private checkProxy(): void {
		if (!this._proxy) {
			throw new Error('C2s proxy not initialized');
		}
	}
}

export const SERVICE_ID = 'c2sService';

export const IC2sService = createDecorator<IC2sService>(SERVICE_ID);

export interface IC2sService {
	_serviceBrand: undefined;
	/**
	 * Test
	 */
	testC2s(testParam: string): Promise<mssql.C2sTestResponse>;

	/**
	 * Get Signing Certificate
	 */
	getSigningCertificate(): Promise<mssql.GetSigningCertficateResponse>;

	/**
	 * Save C2s File
	 */
	save(savePath: string, connectionParams: { [name: string]: any }, shouldSignFile: boolean, signingCertificate: string, passwordEncryptionOption: string, encryptionCertificatePath: string): Promise<mssql.SaveResponse>

	/**
	 * Open C2s File
	 */
	open(openPath: string): Promise<mssql.OpenResponse>;

	/**
	 * Save C2s File
	 */
	showSigningCertificate(signingCertificate: string): Promise<mssql.ShowSigningCertficateResponse>;
}
