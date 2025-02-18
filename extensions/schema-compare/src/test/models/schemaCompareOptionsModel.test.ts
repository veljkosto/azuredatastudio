/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as should from 'should';
import * as mssql from 'mssql';
import { SchemaCompareOptionsModel } from '../../models/schemaCompareOptionsModel';

describe('Schema Compare Options Model', () => {
	it('Should create model and set options successfully', function (): void {
		const model = new SchemaCompareOptionsModel(defaultOptions);
		should.notEqual(model.getOptionsData(), undefined, 'Options shouldn\'t be undefined');
		should.notEqual(model.getObjectsData(), undefined, 'Objects shouldn\'t be undefined');

		should.doesNotThrow(() => model.setDeploymentOptions());
		should.doesNotThrow(() => model.setObjectTypeOptions());

		should(model.getSchemaCompareOptionUtil('')).be.false('Should return false if an invalid option is passed in');
		should(model.getSchemaCompareIncludedObjectsUtil('')).be.false('Should return false if invalid object name is passed in');
	});

	it('Should exclude objects', function (): void {
		const model = new SchemaCompareOptionsModel(defaultOptions);
		should(model.excludedObjectTypes.length).be.equal(0, 'There should be no excluded objects');

		model.objectTypeLabels.forEach(l => {
			model.setSchemaCompareIncludedObjectsUtil(l, false);
		});

		should(model.excludedObjectTypes.length).be.equal(model.objectTypeLabels.length, 'All the object types should be excluded');
	});

	it('Should get descriptions', function (): void {
		const model = new SchemaCompareOptionsModel(defaultOptions);
		model.optionsLabels.forEach(l => {
			should(model.getDescription(l)).not.equal(undefined);
		});
	});
});

const defaultOptions: mssql.DeploymentOptions = {
	ignoreTableOptions: false,
	ignoreSemicolonBetweenStatements: false,
	ignoreRouteLifetime: false,
	ignoreRoleMembership: false,
	ignoreQuotedIdentifiers: false,
	ignorePermissions: false,
	ignorePartitionSchemes: false,
	ignoreObjectPlacementOnPartitionScheme: false,
	ignoreNotForReplication: false,
	ignoreLoginSids: false,
	ignoreLockHintsOnIndexes: false,
	ignoreKeywordCasing: false,
	ignoreIndexPadding: false,
	ignoreIndexOptions: false,
	ignoreIncrement: false,
	ignoreIdentitySeed: false,
	ignoreUserSettingsObjects: false,
	ignoreFullTextCatalogFilePath: false,
	ignoreWhitespace: false,
	ignoreWithNocheckOnForeignKeys: false,
	verifyCollationCompatibility: false,
	unmodifiableObjectWarnings: false,
	treatVerificationErrorsAsWarnings: false,
	scriptRefreshModule: false,
	scriptNewConstraintValidation: false,
	scriptFileSize: false,
	scriptDeployStateChecks: false,
	scriptDatabaseOptions: false,
	scriptDatabaseCompatibility: false,
	scriptDatabaseCollation: false,
	runDeploymentPlanExecutors: false,
	registerDataTierApplication: false,
	populateFilesOnFileGroups: false,
	noAlterStatementsToChangeClrTypes: false,
	includeTransactionalScripts: false,
	includeCompositeObjects: false,
	allowUnsafeRowLevelSecurityDataMovement: false,
	ignoreWithNocheckOnCheckConstraints: false,
	ignoreFillFactor: false,
	ignoreFileSize: false,
	ignoreFilegroupPlacement: false,
	doNotAlterReplicatedObjects: false,
	doNotAlterChangeDataCaptureObjects: false,
	disableAndReenableDdlTriggers: false,
	deployDatabaseInSingleUserMode: false,
	createNewDatabase: false,
	compareUsingTargetCollation: false,
	commentOutSetVarDeclarations: false,
	blockWhenDriftDetected: false,
	blockOnPossibleDataLoss: false,
	backupDatabaseBeforeChanges: false,
	allowIncompatiblePlatform: false,
	allowDropBlockingAssemblies: false,
	dropConstraintsNotInSource: false,
	dropDmlTriggersNotInSource: false,
	dropExtendedPropertiesNotInSource: false,
	dropIndexesNotInSource: false,
	ignoreFileAndLogFilePath: false,
	ignoreExtendedProperties: false,
	ignoreDmlTriggerState: false,
	ignoreDmlTriggerOrder: false,
	ignoreDefaultSchema: false,
	ignoreDdlTriggerState: false,
	ignoreDdlTriggerOrder: false,
	ignoreCryptographicProviderFilePath: false,
	verifyDeployment: false,
	ignoreComments: false,
	ignoreColumnCollation: false,
	ignoreAuthorizer: false,
	ignoreAnsiNulls: false,
	generateSmartDefaults: false,
	dropStatisticsNotInSource: false,
	dropRoleMembersNotInSource: false,
	dropPermissionsNotInSource: false,
	dropObjectsNotInSource: false,
	ignoreColumnOrder: false,
	doNotDropObjectTypes: [],
	excludeObjectTypes: [mssql.SchemaObjectType.Tables]
};
