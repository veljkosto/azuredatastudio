/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { mixin } from 'vs/base/common/objects';
import { Emitter, Event as vsEvent } from 'vs/base/common/event';
import * as strings from 'vs/base/common/strings';


export interface IInputboxColumnOptions extends Slick.PluginOptions {
	columnId?: string;
	cssClass?: string;
	headerCssClass?: string;
	toolTip?: string;
	width?: number;
	title?: string;
	columnIndex?: number;
}

export interface InputBoxCellValue {
	value?: string;
	title?: string;
	placeholder?: string;
	enabled?: boolean;
}

export interface IInputBoxCellActionEventArgs {
	value: string;
	row: number;
	column: number;
}

const defaultOptions: IInputboxColumnOptions = {
	columnId: '_inputbox_selector',
	cssClass: undefined,
	headerCssClass: undefined,
	toolTip: undefined,
	width: 30
};

const inputBoxTemplate = `<div style="display: flex; align-items: center; flex-direction: column">
								<input type="text" value="{0}" title="{1}" aria-label="{1}" placeholder="{2}" {3}/>
							</div>`;

export class InputboxSelectColumn<T extends Slick.SlickData> implements Slick.Plugin<T> {

	private _options: IInputboxColumnOptions;
	private _grid!: Slick.Grid<T>;
	private _handler = new Slick.EventHandler();
	private _onChange = new Emitter<IInputBoxCellActionEventArgs>();
	public readonly onChange: vsEvent<IInputBoxCellActionEventArgs> = this._onChange.event;
	public index: number;

	constructor(options?: IInputboxColumnOptions, columnIndex?: number) {
		this._options = mixin(options, defaultOptions, false);
		this.index = columnIndex ? columnIndex : 0;
	}

	public init(grid: Slick.Grid<T>): void {
		this._grid = grid;
		this._handler.subscribe(this._grid.onKeyDown, (e: Event, args: Slick.OnKeyDownEventArgs<T>) => this.handleKeyDown(e as KeyboardEvent, args));
	}

	private handleKeyDown(e: KeyboardEvent, args: Slick.OnKeyDownEventArgs<T>): void {

		if (this._grid.getColumns()[args.cell] && this._grid.getColumns()[args.cell].id !== this._options.columnId
			|| !(this.getInputboxPropertyValue(args.row).enabled)
		) {
			return;
		}

		if (this._grid.getColumns()[args.cell]
			&& this._grid.getColumns()[args.cell].id === this._options.columnId
			&& jQuery(e.target!).is('input[type="text"]')) {
			this.cellValueChanged((<any>e.target).value, args.row, args.cell, false);
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	}

	private cellValueChanged(val: string, row: number, col: number, reRender: boolean): void {
		this._onChange.fire({
			value: val,
			row: row,
			column: col
		});
		if (reRender) {
			// ensure that grid reflects the change
			this._grid.invalidateRow(row);
			this._grid.render();
		}

		//Ensure that the focus stays correct
		if (this._grid.getActiveCellNode()) {
			this._grid.getActiveCellNode().focus();
		}

		// set selected row to the row of this checkbox
		this._grid.setSelectedRows([row]);
	}

	private getInputboxPropertyValue(row: number): InputBoxCellValue {
		const dataItem = this._grid?.getDataItem(row);
		const propertyValue = (dataItem && this._options.title) ? dataItem[this._options.title] : undefined;
		let inputboxEnabled: boolean = true;
		let inputboxValue: string = undefined;
		let placeholder: string = undefined;

		if (typeof propertyValue === 'string') {
			inputboxEnabled = true;
			inputboxValue = propertyValue;
		} else if (propertyValue !== undefined) {
			inputboxEnabled = propertyValue.enabled === undefined ? true : propertyValue.enabled;
			inputboxValue = propertyValue.value === undefined ? false : propertyValue.value;
			placeholder = propertyValue.placeholder === undefined ? false : propertyValue.placeholder;
		}

		return {
			value: inputboxValue,
			enabled: inputboxEnabled,
			placeholder: placeholder
		};
	}

	public destroy(): void {
		this._handler.unsubscribeAll();
	}

	public get definition(): Slick.Column<T> {
		return {
			id: this._options.columnId,
			name: this._options.title || strings.format(inputBoxTemplate, '', '', ''),
			toolTip: this._options.toolTip,
			field: 'sel',
			width: this._options.width,
			resizable: false,
			sortable: false,
			cssClass: this._options.cssClass,
			headerCssClass: this._options.headerCssClass,
			formatter: (r, c, v, cd, dc) => this.inputboxFormtter(r, c, v, cd, dc as T)
		};
	}

	private inputboxFormtter(row: number, cell: number, value: any, columnDef: Slick.Column<T>, dataContext: T): string {
		return this.getInputBoxHtml(value.value, this._options.title, value.placeholder, value.enabled);
	}


	private getInputBoxHtml(value: string, title: string, placeholder: string, enabled: boolean = true): string {
		return strings.format(inputBoxTemplate, value, title, placeholder, enabled ? '' : 'disabled');
	}

}
