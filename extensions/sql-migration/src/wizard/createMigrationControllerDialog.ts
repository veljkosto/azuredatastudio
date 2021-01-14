/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';

export class CreateIntegrationRuntimeDialog {
	private _dialogObject!: azdata.window.Dialog;
	private _view!: azdata.ModelView;

	constructor() {
		this._dialogObject = azdata.window.createModelViewDialog('Migration Controller', 'MigrationControllerDialog', 'wide');

	}

	initialize() {
		let tab = azdata.window.createTab('');
		this._dialogObject.registerCloseValidator(async () => {
			return true;
		});
		tab.registerContent((view: azdata.ModelView) => {
			this._view = view;

			const dialogDescription = view.modelBuilder.text().withProps({
				value: 'A migration controller is an ARM (Azure Resource Manager) resource created in your Azure subscription and it is needed to coordinate and monitor data migration activities. {0}',
				links: [
					{
						text: 'Learn more',
						url: 'https://www.xyz.com'
					}
				]
			}).component();

			const formHeading = view.modelBuilder.text().withProps({
				value: 'Enter the information below to add a new migration controller.'
			}).component();

			const subscriptionDropdown = view.modelBuilder.dropDown().withProps({
			}).component();

			const resourceGroupDropdown = view.modelBuilder.dropDown().withProps({

			}).component();

			const controllerName = view.modelBuilder.inputBox().withProps({

			}).component();

			const locationDropdown = view.modelBuilder.dropDown().withProps({

			}).component();

			const formSubmitButton = view.modelBuilder.button().withProps({
				label: 'Submit',
				width: '80px'
			}).component();

			const creationStatusContainer = this.createControllerStatus();

			const formBuilder = view.modelBuilder.formContainer().withFormItems(
				[
					{
						component: dialogDescription,
					},
					{
						component: formHeading,
					},
					{
						component: subscriptionDropdown,
						title: 'Subscription'
					},
					{
						component: resourceGroupDropdown,
						title: 'Resource Group'
					},
					{
						component: controllerName,
						title: 'Name',
					},
					{
						component: locationDropdown,
						title: 'Location'
					},
					{
						component: formSubmitButton
					},
					{
						component: creationStatusContainer
					}
				],
				{
					horizontal: false
				}
			);

			const form = formBuilder.withLayout({ width: '100%' }).component();

			return view.initializeModel(form).then(() => {
			});
		});

		this._dialogObject.content = [tab];

		azdata.window.openDialog(this._dialogObject);
	}

	private createControllerStatus(): azdata.FlexContainer {
		const informationTextBox = this._view.modelBuilder.text().withProps({
			value: 'Migration Controller uses self-hosted Integration Runtime offered by Azure Data Factory for data movement and other migration activities. Follow the instructions below to setup self-hosted Integration Runtime.'
		}).component();

		const expressSetupTitle = this._view.modelBuilder.text().withProps({
			value: 'Option 1: Express setup',
			CSSStyles: {
				'font-weight': 'bold'
			}
		}).component();

		const expressSetupLink = this._view.modelBuilder.button().withProps({
			label: 'Open the express setup for this computer'
		}).component();

		const manualSetupTitle = this._view.modelBuilder.text().withProps({
			value: 'Option 2: Manual setup',
			CSSStyles: {
				'font-weight': 'bold'
			}
		}).component();

		const manualSetupStepText = this._view.modelBuilder.text().withProps({
			value: 'Step 1: '
		}).component();

		const manualSetupButton = this._view.modelBuilder.button().withProps({
			label: 'Download and install integration runtime'
		}).component();

		const manualSetupStepContainer = this._view.modelBuilder.flexContainer().withItems(
			[
				manualSetupStepText,
				manualSetupButton
			]
		).component();

		const manualSetupSecondDescription = this._view.modelBuilder.text().withProps({
			value: 'Step 2: Use this key to register your integration runtime'
		}).component();

		const connectionStatusTitle = this._view.modelBuilder.text().withProps({
			value: 'Connection Status',
			CSSStyles: {
				'font-weight': 'bold'
			}
		}).component();

		const connectionStatus = this._view.modelBuilder.text().withProps({
			value: 'Migration Controller \'CONTOSO-IT-SQL-MC1\' is not connected to self-hosted Integration Runtime on any node. Click Refresh.'
		}).component();

		const refreshButton = this._view.modelBuilder.button().withProps({
			label: 'Refresh'
		}).component();

		const connectionStatusContainer = this._view.modelBuilder.flexContainer().withItems(
			[
				connectionStatus,
				refreshButton
			]
		).component();

		const container = this._view.modelBuilder.flexContainer().withItems(
			[
				informationTextBox,
				expressSetupTitle,
				expressSetupLink,
				manualSetupTitle,
				manualSetupStepContainer,
				manualSetupSecondDescription,
				connectionStatusTitle,
				connectionStatusContainer
			]
		).withLayout({
			flexFlow: 'column'
		}).component();

		return container;
	}
}
