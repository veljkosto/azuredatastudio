/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as mssql from 'mssql';

import { ExtHostC2sShape } from 'sql/workbench/api/common/sqlExtHost.protocol';
import { ExtensionIdentifier } from 'vs/platform/extensions/common/extensions';
import { IExtHostExtensionService } from 'vs/workbench/api/common/extHostExtensionService';

export class ExtHostC2s extends ExtHostC2sShape {
	constructor(@IExtHostExtensionService private _extHostExtensionService: IExtHostExtensionService,) {
		super();
	}

	public override $c2sTest(testParam: string): Thenable<mssql.C2sTestResponse> {
		const api = this.getApi();
		return api.c2s.C2sTest(testParam);
	}

	public override $getSigningCertificate(): Thenable<mssql.GetSigningCertficateResponse> {
		const api = this.getApi();
		return api.c2s.GetSigningCertificate();
	}

	public override $save(savePath: string, connectionParams: { [name: string]: any }, shouldSignFile: boolean, signingCertificate: string, passwordEncryptionOption: string, encryptionCertificatePath: string): Thenable<mssql.SaveResponse> {
		const api = this.getApi();
		return api.c2s.Save(savePath, connectionParams, shouldSignFile, signingCertificate, passwordEncryptionOption, encryptionCertificatePath);
	}

	public override $open(openPath: string): Thenable<mssql.OpenResponse> {
		const api = this.getApi();
		return api.c2s.Open(openPath);
	}

	public override $showSigningCertificate(signingCertificate: string): Thenable<mssql.ShowSigningCertficateResponse> {
		const api = this.getApi();
		return api.c2s.ShowSigningCertificate(signingCertificate);
	}

	private getApi(): mssql.IExtension {
		return this._extHostExtensionService.getExtensionExports(new ExtensionIdentifier(mssql.extension.name)) as mssql.IExtension;
	}
}
