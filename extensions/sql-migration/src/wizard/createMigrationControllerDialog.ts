/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import { getMigrationControllerRegions, getResourceGroups, getSubscriptions, Subscription } from '../api/azure';
import { MigrationStateModel } from '../models/stateMachine';
import * as constants from '../models/strings';

export class CreateIntegrationRuntimeDialog {
	private migrationControllerSubscriptionDropdown!: azdata.DropDownComponent;
	private migrationControllerResourceGroupDropdown!: azdata.DropDownComponent;
	private migrationControllerRegionDropdown!: azdata.DropDownComponent;
	private migrationControllerNameText!: azdata.InputBoxComponent;

	private _dialogObject!: azdata.window.Dialog;
	private _view!: azdata.ModelView;

	private _subscriptionMap: Map<string, Subscription> = new Map();

	constructor(private migrationStateModel: MigrationStateModel) {
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

			const formSubmitButton = view.modelBuilder.button().withProps({
				label: 'Submit',
				width: '80px'
			}).component();

			const creationStatusContainer = this.createControllerStatus();

			const formBuilder = view.modelBuilder.formContainer().withFormItems(
				[
					{
						component: dialogDescription
					},
					{
						component: this.migrationControllerDropdownsContainer()
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
				this.populateSubscriptions();
			});
		});

		this._dialogObject.content = [tab];
		azdata.window.openDialog(this._dialogObject);
	}

	private migrationControllerDropdownsContainer(): azdata.FlexContainer {
		const formHeading = this._view.modelBuilder.text().withProps({
			value: 'Enter the information below to add a new migration controller.'
		}).component();

		const subscriptionDropdownLabel = this._view.modelBuilder.text().withProps({
			value: 'Subscription'
		}).component();

		this.migrationControllerSubscriptionDropdown = this._view.modelBuilder.dropDown().withProps({
			required: true
		}).component();

		this.migrationControllerSubscriptionDropdown.onValueChanged((e) => {
			if (this.migrationControllerSubscriptionDropdown.value) {
				this.populateResourceGroups();
			}
		});

		const resourceGroupDropdownLabel = this._view.modelBuilder.text().withProps({
			value: 'Resource Group'
		}).component();

		this.migrationControllerResourceGroupDropdown = this._view.modelBuilder.dropDown().withProps({
			required: true
		}).component();

		const controllerNameLabel = this._view.modelBuilder.text().withProps({
			value: 'Name'
		}).component();

		this.migrationControllerNameText = this._view.modelBuilder.inputBox().withProps({

		}).component();

		const regionsDropdownLabel = this._view.modelBuilder.text().withProps({
			value: 'Region'
		}).component();

		this.migrationControllerRegionDropdown = this._view.modelBuilder.dropDown().withProps({
			required: true,
			values: getMigrationControllerRegions()
		}).component();

		const flexContainer = this._view.modelBuilder.flexContainer().withItems([
			formHeading,
			subscriptionDropdownLabel,
			this.migrationControllerSubscriptionDropdown,
			resourceGroupDropdownLabel,
			this.migrationControllerResourceGroupDropdown,
			controllerNameLabel,
			this.migrationControllerNameText,
			regionsDropdownLabel,
			this.migrationControllerRegionDropdown
		]).withLayout({
			flexFlow: 'column'
		}).component();
		return flexContainer;
	}

	private async populateSubscriptions(): Promise<void> {
		this.migrationControllerSubscriptionDropdown.loading = true;
		this.migrationControllerResourceGroupDropdown.loading = true;
		const subscriptions = await getSubscriptions(this.migrationStateModel.azureAccount);

		let subscriptionDropdownValues: azdata.CategoryValue[] = [];
		if (subscriptions && subscriptions.length > 0) {

			subscriptions.forEach((subscription) => {
				this._subscriptionMap.set(subscription.id, subscription);
				subscriptionDropdownValues.push({
					name: subscription.id,
					displayName: subscription.name + ' - ' + subscription.id,
				});
			});


		} else {
			subscriptionDropdownValues = [
				{
					displayName: constants.NO_SUBSCRIPTIONS_FOUND,
					name: ''
				}
			];
		}

		this.migrationControllerSubscriptionDropdown.values = subscriptionDropdownValues;
		this.migrationControllerSubscriptionDropdown.loading = false;
		this.populateResourceGroups();
	}

	private async populateResourceGroups(): Promise<void> {
		this.migrationControllerResourceGroupDropdown.loading = true;
		let subscription = this._subscriptionMap.get((this.migrationControllerSubscriptionDropdown.value as azdata.CategoryValue).name)!;
		const resourceGroups = await getResourceGroups(this.migrationStateModel.azureAccount, subscription);
		let resourceGroupDropdownValues: azdata.CategoryValue[] = [];
		if (resourceGroups && resourceGroups.length > 0) {
			resourceGroups.forEach((resourceGroup) => {
				resourceGroupDropdownValues.push({
					name: resourceGroup.name,
					displayName: resourceGroup.name
				});
			});
		} else {
			resourceGroupDropdownValues = [
				{
					displayName: 'No Resource Groups found',
					name: ''
				}
			];
		}
		this.migrationControllerResourceGroupDropdown.values = resourceGroupDropdownValues;
		this.migrationControllerResourceGroupDropdown.loading = false;
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
