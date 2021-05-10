/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ControllerInfo } from 'arc';
import * as process from 'process';
import * as sinon from 'sinon';
import * as TypeMoq from 'typemoq';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import * as loc from '../../localizedConstants';
import * as kubeUtils from '../../common/kubeUtils';
import { ControllerModel } from '../../models/controllerModel';
import { ConnectToControllerDialog } from '../../ui/dialogs/connectControllerDialog';
import { AzureArcTreeDataProvider } from '../../ui/tree/azureArcTreeDataProvider';

interface ExtensionGlobalMemento extends vscode.Memento {
	setKeysForSync(keys: string[]): void;
}

function getDefaultControllerInfo(): ControllerInfo {
	return {
		id: uuid(),
		endpoint: undefined,
		kubeConfigFilePath: '/root/.kube/config',
		kubeClusterContext: 'kubeadmin@kubernetes',
		username: 'admin',
		name: '',
		namespace: process.env['CLUSTER_NAME'] || '',
		rememberPassword: true,
		resources: []
	};
}

describe('ControllerModel', function (): void {
	afterEach(function (): void {
		sinon.restore();
	});

	describe('login', function (): void {
		let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;
		let mockGlobalState: TypeMoq.IMock<ExtensionGlobalMemento>;

		before(function (): void {
			mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
			mockGlobalState = TypeMoq.Mock.ofType<ExtensionGlobalMemento>();
			mockExtensionContext.setup(x => x.globalState).returns(() => mockGlobalState.object);
		});

		beforeEach(function (): void {
			sinon.stub(ConnectToControllerDialog.prototype, 'showDialog');
			sinon.stub(kubeUtils, 'getKubeConfigClusterContexts').returns([{ name: 'currentCluster', isCurrentContext: true }]);
			sinon.stub(vscode.window, 'showErrorMessage').resolves(<any>loc.yes);
		});

		it('Can log in', async function (): Promise<void> {
			const model = new ControllerModel(new AzureArcTreeDataProvider(mockExtensionContext.object), getDefaultControllerInfo(), process.env['AZDATA_PASSWORD']);
			await model.login();
		});
	});

});
