/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
// import * as mssql from '../../../../mssql';
import { MigrationStateModel } from '../../models/stateMachine';
import { SqlDatabaseTree } from './sqlDatabasesTree';
// import { SqlAssessmentResultList } from './sqlAssessmentResultsList';
import { SqlMigrationImpactedObjectInfo } from '../../../../mssql/src/mssql';

export type Issues = {
	description: string,
	recommendation: string,
	moreInfo: string,
	impactedObjects: SqlMigrationImpactedObjectInfo[],
	rowNumber: number
};
export class AssessmentResultsDialog {

	private static readonly OkButtonText: string = 'OK';
	private static readonly CancelButtonText: string = 'Cancel';

	private _isOpen: boolean = false;
	private dialog: azdata.window.Dialog | undefined;
	private _model: MigrationStateModel;

	// Dialog Name for Telemetry
	public dialogName: string | undefined;

	private _tree: SqlDatabaseTree;
	// private _list: SqlAssessmentResultList;


	constructor(public ownerUri: string, public model: MigrationStateModel, public title: string) {
		this._model = model;
		let assessmentData = this.parseData(this._model);
		this._tree = new SqlDatabaseTree(assessmentData);
		// this._list = new SqlAssessmentResultList();
	}


	private async initializeDialog(dialog: azdata.window.Dialog): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			dialog.registerContent(async (view) => {
				try {
					const resultComponent = await this._tree.createComponentResult(view);
					const treeComponent = await this._tree.createComponent(view);
					// const separator1 = this.buildSeparator(view);
					// const listComponent = await this._list.createComponent(view);
					// const separator2 = view.modelBuilder.separator().component();

					const flex = view.modelBuilder.flexContainer().withLayout({
						flexFlow: 'row',
						height: '100%',
						width: '100%'
					}).withProps({
						CSSStyles: {
							'margin-top': '10px'
						}
					}).component();
					flex.addItem(treeComponent, { flex: '0 0 auto' });
					flex.addItem(resultComponent, { flex: '1 1 auto' });

					view.initializeModel(flex);
					resolve();
				} catch (ex) {
					reject(ex);
				}
			});
		});
	}

	public async openDialog() {
		if (!this._isOpen) {
			this._isOpen = true;
			this.dialog = azdata.window.createModelViewDialog(this.title, this.title, true);

			this.dialog.okButton.label = AssessmentResultsDialog.OkButtonText;
			this.dialog.okButton.onClick(async () => await this.execute());

			this.dialog.cancelButton.label = AssessmentResultsDialog.CancelButtonText;
			this.dialog.cancelButton.onClick(async () => await this.cancel());

			const dialogSetupPromises: Thenable<void>[] = [];

			dialogSetupPromises.push(this.initializeDialog(this.dialog));
			azdata.window.openDialog(this.dialog);

			await Promise.all(dialogSetupPromises);
		}
	}


	private parseData(model: MigrationStateModel): Map<string, Issues[]> {
		// if there are multiple issues for the same DB, need to consolidate
		// map DB name -> Assessment result items (issues)
		// map assessment result items to description, recommendation, more info & impacted objects

		let dbMap = new Map<string, Issues[]>();

		model.assessmentResults?.forEach((element) => {
			let issues: Issues;
			issues = {
				description: element.description,
				recommendation: element.message,
				moreInfo: element.helpLink,
				impactedObjects: element.impactedObjects,
				rowNumber: 0
			};
			let dbIssues = dbMap.get(element.targetName);
			if (dbIssues) {
				dbMap.set(element.targetName, dbIssues.concat([issues]));
			} else {
				dbMap.set(element.targetName, [issues]);
			}
		});

		return dbMap;
	}

	protected async execute() {
		this._isOpen = false;
	}

	protected async cancel() {
		this._isOpen = false;
	}


	public get isOpen(): boolean {
		return this._isOpen;
	}
}


	// private convertAssessmentToData(assessments: mssql.SqlMigrationAssessmentResultItem[] | undefined): Array<string | number>[] {
	// 	let result: Array<string | number>[] = [];
	// 	if (assessments) {
	// 		assessments.forEach(assessment => {
	// 			if (assessment.impactedObjects && assessment.impactedObjects.length > 0) {
	// 				assessment.impactedObjects.forEach(impactedObject => {
	// 					this.addAssessmentColumn(result, assessment, impactedObject);
	// 				});
	// 			} else {
	// 				this.addAssessmentColumn(result, assessment, undefined);
	// 			}
	// 		});
	// 	}
	// 	return result;
	// }

	// private addAssessmentColumn(
	// 	result: Array<string | number>[],
	// 	assessment: mssql.SqlMigrationAssessmentResultItem,
	// 	impactedObject: mssql.SqlMigrationImpactedObjectInfo | undefined): void {
	// 	let cols = [];
	// 	//cols.push(assessment.appliesToMigrationTargetPlatform);
	// 	cols.push(assessment.displayName);
	// 	cols.push(assessment.checkId);
	// 	//cols.push(assessment.rulesetName);
	// 	cols.push(assessment.description);
	// 	cols.push(impactedObject?.name ?? '');
	// 	result.push(cols);
	// }


	// private _assessmentTable: azdata.TableComponent | undefined;
	// private createResultsList(view: azdata.ModelView): void {
	// 	this._assessmentTable = view.modelBuilder.table()
	// 		.withProperties({
	// 			columns: [
	// 				'Rule',
	// 				'Rule ID',
	// 				'Description',
	// 				'Impacted Objects'
	// 			],
	// 			data: [],
	// 			height: 700,
	// 			width: 1100
	// 		}).component();
	// }
