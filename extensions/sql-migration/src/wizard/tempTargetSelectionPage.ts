/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import { getAvailableManagedInstanceProducts, SqlManagedInstance } from '../api/azure';
import { WIZARD_INPUT_COMPONENT_WIDTH } from '../constants';
import { MigrationWizardPage } from '../models/migrationWizardPage';
import { MigrationStateModel, StateChangeEvent } from '../models/stateMachine';
import * as constants from '../models/strings';

export class TempTargetSelectionPage extends MigrationWizardPage {

	private _managedInstanceSubscriptionDropdown!: azdata.DropDownComponent;
	private _managedInstanceDropdown!: azdata.DropDownComponent;

	constructor(wizard: azdata.window.Wizard, migrationStateModel: MigrationStateModel) {
		super(wizard, azdata.window.createWizardPage(constants.TARGET_SELECTION_PAGE_TITLE), migrationStateModel);
	}

	protected async registerContent(view: azdata.ModelView): Promise<void> {

		const managedInstanceSubscriptionDropdownLabel = view.modelBuilder.text().withProps({
			value: constants.SUBSCRIPTION
		}).component();
		this._managedInstanceSubscriptionDropdown = view.modelBuilder.dropDown().withProps({
			width: WIZARD_INPUT_COMPONENT_WIDTH
		}).component();
		this._managedInstanceSubscriptionDropdown.onValueChanged((e) => {
			if (this._managedInstanceSubscriptionDropdown.value) {
				this.migrationStateModel._targetSubscriptionId = (<azdata.CategoryValue>this._managedInstanceSubscriptionDropdown.value).name;
				this.populateManagedInstanceDropdown();
			}
		});
		const managedInstanceDropdownLabel = view.modelBuilder.text().withProps({
			value: constants.MANAGED_INSTANCE
		}).component();
		this._managedInstanceDropdown = view.modelBuilder.dropDown().withProps({
			width: WIZARD_INPUT_COMPONENT_WIDTH
		}).component();
		this._managedInstanceDropdown.onValueChanged((e) => {
			if (this._managedInstanceDropdown.value) {
				this.migrationStateModel._targetSQLMIServer = (<azdata.CategoryValue>this._managedInstanceDropdown.value).name;
			}
		});
		const targetContainer = view.modelBuilder.flexContainer().withItems(
			[
				managedInstanceSubscriptionDropdownLabel,
				this._managedInstanceSubscriptionDropdown,
				managedInstanceDropdownLabel,
				this._managedInstanceDropdown
			]
		).withLayout({
			flexFlow: 'column'
		}).component();

		const form = view.modelBuilder.formContainer()
			.withFormItems(
				[
					{
						component: targetContainer
					}
				]
			);
		await view.initializeModel(form.component());
	}
	public async onPageEnter(): Promise<void> {
		this.populateSubscriptionDropdown();
	}
	public async onPageLeave(): Promise<void> {
	}
	protected async handleStateChange(e: StateChangeEvent): Promise<void> {
	}

	private async populateSubscriptionDropdown(): Promise<void> {
		this._managedInstanceSubscriptionDropdown.values = this.migrationStateModel.getSubscriptionDropdownValue();
		this.populateManagedInstanceDropdown();
	}

	private async populateManagedInstanceDropdown(): Promise<void> {
		this._managedInstanceDropdown.loading = true;
		let mis: SqlManagedInstance[] = [];
		let miValues: azdata.CategoryValue[] = [];
		try {
			mis = await getAvailableManagedInstanceProducts(this.migrationStateModel.azureAccount, this.migrationStateModel._subscriptionMap.get(this.migrationStateModel._targetSubscriptionId)!);
			mis.forEach((mi) => {
				miValues.push({
					name: mi.name,
					displayName: mi.name
				});
			});

			if (!miValues || miValues.length === 0) {
				miValues = [
					{
						displayName: constants.NO_MANAGED_INSTANCE_FOUND,
						name: ''
					}
				];
			}

			this._managedInstanceDropdown.values = miValues;
		} catch (error) {
			this.setEmptyDropdownPlaceHolder(this._managedInstanceDropdown, constants.NO_MANAGED_INSTANCE_FOUND);
		}

		this._managedInstanceDropdown.loading = false;
	}

	private setEmptyDropdownPlaceHolder(dropDown: azdata.DropDownComponent, placeholder: string): void {
		dropDown.values = [{
			displayName: placeholder,
			name: ''
		}];
	}
}
