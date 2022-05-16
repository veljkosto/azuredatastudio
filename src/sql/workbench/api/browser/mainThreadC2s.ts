/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import type * as mssql from 'mssql';
import { Disposable } from 'vs/base/common/lifecycle';
import {
	ExtHostC2sShape,
	MainThreadC2sShape,
	SqlExtHostContext,
	SqlMainContext
} from 'sql/workbench/api/common/sqlExtHost.protocol';
import { IExtHostContext } from 'vs/workbench/api/common/extHost.protocol';
import { extHostNamedCustomer } from 'vs/workbench/api/common/extHostCustomers';
import { C2sService, IC2sService } from 'sql/workbench/services/connection/browser/c2sService';


@extHostNamedCustomer(SqlMainContext.MainThreadC2s)
export class MainThreadC2s extends Disposable implements MainThreadC2sShape {
	private _proxy: ExtHostC2sShape;
	public _serviceBrand: undefined;

	constructor(
		extHostContext: IExtHostContext,
		@IC2sService c2sService: IC2sService
	) {
		super();
		this._proxy = extHostContext.getProxy(SqlExtHostContext.ExtHostC2s);
		(c2sService as C2sService).registerProxy(this);
	}

	public testC2s(testParam: string): Thenable<mssql.C2sTestResponse> {
		return this._proxy.$c2sTest(testParam);
	}

	public getSigningCertificate(): Thenable<mssql.GetSigningCertficateResponse> {
		return this._proxy.$getSigningCertificate();
	}

	public save(savePath: string, connectionParams: { [name: string]: any }, shouldSignFile: boolean, signingCertificate: string, passwordEncryptionOption: string, encryptionCertificatePath: string): Thenable<mssql.SaveResponse> {
		return this._proxy.$save(savePath, connectionParams, shouldSignFile, signingCertificate, passwordEncryptionOption, encryptionCertificatePath);
	}

	public open(openPath: string): Thenable<mssql.OpenResponse> {
		return this._proxy.$open(openPath);
	}

	public showSigningCertificate(signingCertificate: string): Thenable<mssql.ShowSigningCertficateResponse> {
		return this._proxy.$showSigningCertificate(signingCertificate);
	}
}
