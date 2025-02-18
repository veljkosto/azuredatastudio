/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as azdata from 'azdata';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';


export const SERVICE_ID = 'executionPlanService';

export const IExecutionPlanService = createDecorator<IExecutionPlanService>(SERVICE_ID);

export interface IExecutionPlanService {
	_serviceBrand: undefined;

	/**
	 * Registers an execution plan service provider.
	 */
	registerProvider(providerId: string, provider: azdata.executionPlan.ExecutionPlanProvider): void;
	/**
	 * Gets an execution plan for the given planFile.
	 */
	getExecutionPlan(planFile: azdata.executionPlan.ExecutionPlanGraphInfo): Promise<azdata.executionPlan.GetExecutionPlanResult>;
	/**
	 * Compares two execution plans and identifies matching regions in both execution plans.
	 * @param firstPlanFile file that contains the first execution plan.
	 * @param secondPlanFile file that contains the second execution plan.
	 */
	compareExecutionPlanGraph(firstPlanFile: azdata.executionPlan.ExecutionPlanGraphInfo, secondPlanFile: azdata.executionPlan.ExecutionPlanGraphInfo): Promise<azdata.executionPlan.ExecutionPlanComparisonResult>;

	/**
	 * Get execution plan file extensions supported by the provider.
	 */
	getSupportedExecutionPlanExtensionsForProvider(providerId: string): string[];
}
