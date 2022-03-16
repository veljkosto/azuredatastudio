/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INotebookEditOperation, NotebookEditOperationType } from 'sql/workbench/api/common/sqlExtHostTypes';
import { INotebookService } from 'sql/workbench/services/notebook/browser/notebookService';
import { groupBy } from 'vs/base/common/arrays';
import { CancellationToken } from 'vs/base/common/cancellation';
import { compare } from 'vs/base/common/strings';
import { URI } from 'vs/base/common/uri';
import { ResourceEdit } from 'vs/editor/browser/services/bulkEditService';
import { WorkspaceEditMetadata } from 'vs/editor/common/modes';
import { IProgress } from 'vs/platform/progress/common/progress';
import { UndoRedoGroup, UndoRedoSource } from 'vs/platform/undoRedo/common/undoRedo';
import { CellEditType, ICellEditOperation, IDocumentMetadataEdit } from 'vs/workbench/contrib/notebook/common/notebookCommon';

export class ResourceNotebookCellEdit extends ResourceEdit {

	constructor(
		readonly resource: URI,
		readonly cellEdit: ICellEditOperation,
		readonly versionId?: number,
		metadata?: WorkspaceEditMetadata
	) {
		super(metadata);
	}
}

export class BulkCellEdits {

	// {{SQL CARBON EDIT}} Use our own notebook editing
	constructor(
		_undoRedoGroup: UndoRedoGroup,
		undoRedoSource: UndoRedoSource | undefined,
		private _progress: IProgress<void>,
		private _token: CancellationToken,
		private _edits: ResourceNotebookCellEdit[],
		@INotebookService private _notebookService: INotebookService
	) { }

	async apply(): Promise<void> {

		const editsByNotebook = groupBy(this._edits, (a, b) => compare(a.resource.toString(), b.resource.toString()));

		for (let group of editsByNotebook) {
			if (this._token.isCancellationRequested) {
				break;
			}
			const [first] = group;

			// apply edits
			let editor = await this._notebookService.findNotebookEditor(first.resource);
			if (editor) {
				const edits = group.map(entry => convertToNotebookEdit(entry.cellEdit)).filter(edit => edit !== undefined);
				editor.executeEdits(edits);
			}

			this._progress.report(undefined);
		}
	}
}

function convertToNotebookEdit(cellEdit: ICellEditOperation): INotebookEditOperation {
	let convertedEdit: INotebookEditOperation;
	switch (cellEdit.editType) {
		case CellEditType.DocumentMetadata:
			let documentEdit = cellEdit as IDocumentMetadataEdit;
			convertedEdit = {
				type: NotebookEditOperationType.UpdateDocumentMetadata,
				range: { start: -1, end: -1 },
				cell: {},
				metadata: documentEdit.metadata
			};
			break;
		case CellEditType.Replace:
		case CellEditType.Output:
		case CellEditType.Metadata:
		case CellEditType.CellLanguage:
		case CellEditType.Move:
		case CellEditType.OutputItems:
		case CellEditType.PartialMetadata:
		case CellEditType.PartialInternalMetadata:
		default:
			break; // These other operations are not supported yet
	}
	return convertedEdit;
}
