/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import { getMigrationController, getMigrationControllerRegions, getResourceGroups, getSubscriptions, Subscription } from '../api/azure';
import { MigrationWizardPage } from '../models/migrationWizardPage';
import { MigrationStateModel, StateChangeEvent } from '../models/stateMachine';
import { CreateIntegrationRuntimeDialog } from './createMigrationControllerDialog';
import * as constants from '../models/strings';

export class IntergrationRuntimePage extends MigrationWizardPage {

	private migrationControllerSubscriptionDropdown!: azdata.DropDownComponent;
	private migrationControllerResourceGroupDropdown!: azdata.DropDownComponent;
	private migrationControllerRegionDropdown!: azdata.DropDownComponent;
	private migrationControllerDropdown!: azdata.DropDownComponent;

	private defaultSetupRadioButton!: azdata.RadioButtonComponent;
	private customSetupRadioButton!: azdata.RadioButtonComponent;

	private startSetupButton!: azdata.ButtonComponent;
	private cancelSetupButton!: azdata.ButtonComponent;

	private createMigrationContainer!: azdata.FlexContainer;

	private _subscriptionMap: Map<string, Subscription> = new Map();

	private _view!: azdata.ModelView;

	constructor(wizard: azdata.window.Wizard, migrationStateModel: MigrationStateModel) {
		super(wizard, azdata.window.createWizardPage('Migration Controller'), migrationStateModel);
	}

	protected async registerContent(view: azdata.ModelView): Promise<void> {
		this._view = view;
		const descriptionText = view.modelBuilder.text().withProps({
			value: 'An migration controller is an ARM (Azure Resource Manager) resource created in your Azure subscription and it is needed to coordinate and monitor data migration activities. If one already exists in your subscription, you can reuse it here. Alternatively you can create a new one by clicking New. {0}',
			links: [
				{
					url: 'https://www.xyz.com',
					text: 'Learn More'
				},
			]
		}).component();

		const createNewController = view.modelBuilder.button().withProps({
			label: 'New',
			width: '100px'
		}).component();

		createNewController.onDidClick((e) => {
			const dialog = new CreateIntegrationRuntimeDialog(this.migrationStateModel);
			dialog.initialize();
			// TODO: Allow express creation in later updates.
			// this.createMigrationContainer.display = 'inline';
		});

		const setupButtonGroup = 'setupOptions';

		this.defaultSetupRadioButton = view.modelBuilder.radioButton().withProps({
			label: 'Setup with defaults: Add migration controller with one click express setup using default options.',
			name: setupButtonGroup
		}).component();
		this.defaultSetupRadioButton.checked = true;

		this.customSetupRadioButton = view.modelBuilder.radioButton().withProps({
			label: 'Custom setup: Add migration controller after customizing most options.',
			name: setupButtonGroup
		}).component();

		this.startSetupButton = view.modelBuilder.button().withProps({
			label: 'Create',
			width: '100px'
		}).component();

		this.startSetupButton.onDidClick((e) => {
			const dialog = new CreateIntegrationRuntimeDialog(this.migrationStateModel);
			dialog.initialize();
			return;
			if (this.defaultSetupRadioButton.checked) {
				console.log('Doing default setup');
			} else {
				console.log('Doing custom setup opening the dialog');
				const dialog = new CreateIntegrationRuntimeDialog(this.migrationStateModel);
				dialog.initialize();
			}
		});

		this.cancelSetupButton = view.modelBuilder.button().withProps({
			label: 'Cancel',
			width: '100px'
		}).component();

		this.cancelSetupButton.onDidClick((e) => {
			this.createMigrationContainer.display = 'none';
		});

		const setupButtonsContainer = view.modelBuilder.flexContainer().withItems([
			this.startSetupButton,
			this.cancelSetupButton
		],
			{ CSSStyles: { 'margin': '10px', } }
		).withLayout({
			flexFlow: 'row'
		}).component();

		this.createMigrationContainer = view.modelBuilder.flexContainer().withItems(
			[
				this.defaultSetupRadioButton,
				this.customSetupRadioButton,
				setupButtonsContainer
			]
		).withLayout({
			flexFlow: 'column'
		}).component();

		this.createMigrationContainer.display = 'none';

		const form = view.modelBuilder.formContainer()
			.withFormItems(
				[
					{
						component: descriptionText
					},
					{
						component: this.migrationControllerDropdownsContainer()
					},
					{
						component: createNewController
					},
					{
						component: this.createMigrationContainer
					},

				]
			);
		await view.initializeModel(form.component());
	}

	public async onPageEnter(): Promise<void> {
		this.populateSubscriptions();
	}

	public async onPageLeave(): Promise<void> {
	}

	protected async handleStateChange(e: StateChangeEvent): Promise<void> {
	}

	private migrationControllerDropdownsContainer(): azdata.FlexContainer {

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

		this.migrationControllerResourceGroupDropdown.onValueChanged((e) => {
			if (this.migrationControllerResourceGroupDropdown.value) {
				this.populateMigrationController();
			}
		});

		const regionsDropdownLabel = this._view.modelBuilder.text().withProps({
			value: 'Region'
		}).component();

		this.migrationControllerRegionDropdown = this._view.modelBuilder.dropDown().withProps({
			required: true,
			values: getMigrationControllerRegions()
		}).component();

		this.migrationControllerRegionDropdown.onValueChanged((e) => {
		});

		const migrationControllerDropdownLabel = this._view.modelBuilder.text().withProps({
			value: 'Select a migration controller'
		}).component();

		this.migrationControllerDropdown = this._view.modelBuilder.dropDown().withProps({
			required: true,
		}).component();

		const flexContainer = this._view.modelBuilder.flexContainer().withItems([
			subscriptionDropdownLabel,
			this.migrationControllerSubscriptionDropdown,
			resourceGroupDropdownLabel,
			this.migrationControllerResourceGroupDropdown,
			regionsDropdownLabel,
			this.migrationControllerRegionDropdown,
			migrationControllerDropdownLabel,
			this.migrationControllerDropdown
		]).withLayout({
			flexFlow: 'column'
		}).component();
		return flexContainer;
	}

	private async populateSubscriptions(): Promise<void> {
		this.migrationControllerSubscriptionDropdown.loading = true;
		this.migrationControllerResourceGroupDropdown.loading = true;
		this.migrationControllerDropdown.loading = true;
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
		this.populateMigrationController();
	}

	private async populateMigrationController(): Promise<void> {
		this.migrationControllerDropdown.loading = true;
		let subscription = this._subscriptionMap.get((this.migrationControllerSubscriptionDropdown.value as azdata.CategoryValue).name)!;
		let regionName = (this.migrationControllerRegionDropdown.value as azdata.CategoryValue).name!;
		let resourceGroupName = (this.migrationControllerResourceGroupDropdown.value as azdata.CategoryValue).name!;
		const migrationControllers = await getMigrationController(this.migrationStateModel.azureAccount, subscription, resourceGroupName, regionName);
		let migrationContollerValues: azdata.CategoryValue[] = [];
		if (migrationControllers && migrationControllers.length > 0) {
			migrationControllers.forEach((controller) => {
				migrationContollerValues.push({
					name: controller.name,
					displayName: controller.name
				});
			});
		} else {
			migrationContollerValues = [
				{
					displayName: 'No Migration Controllers found. Please create a new one',
					name: ''
				}
			];
		}
		this.migrationControllerDropdown.values = migrationContollerValues;
		this.migrationControllerDropdown.loading = false;
	}

}


