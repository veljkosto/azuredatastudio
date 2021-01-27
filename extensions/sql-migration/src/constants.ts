/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export const WIZARD_INPUT_COMPONENT_WIDTH = '400px';

export interface IconPath {
	dark: string;
	light: string;
}

export class IconPathHelper {
	private static context: vscode.ExtensionContext;

	public static add: IconPath;
	public static edit: IconPath;
	public static delete: IconPath;
	public static openInTab: IconPath;
	public static copy: IconPath;
	public static collapseUp: IconPath;
	public static collapseDown: IconPath;
	public static postgres: IconPath;
	public static computeStorage: IconPath;
	public static connection: IconPath;
	public static backup: IconPath;
	public static properties: IconPath;
	public static networking: IconPath;
	public static refresh: IconPath;
	public static reset: IconPath;
	public static support: IconPath;
	public static wrench: IconPath;
	public static miaa: IconPath;
	public static controller: IconPath;
	public static health: IconPath;
	public static success: IconPath;
	public static save: IconPath;
	public static discard: IconPath;
	public static fail: IconPath;
	public static information: IconPath;
	public static gear: IconPath;

	public static setExtensionContext(context: vscode.ExtensionContext) {
		IconPathHelper.context = context;
		IconPathHelper.copy = {
			light: IconPathHelper.context.asAbsolutePath('images/copy.svg'),
			dark: IconPathHelper.context.asAbsolutePath('images/copy.svg')
		};
		IconPathHelper.refresh = {
			light: context.asAbsolutePath('images/refresh.svg'),
			dark: context.asAbsolutePath('images/refresh.svg')
		};

	}
}
