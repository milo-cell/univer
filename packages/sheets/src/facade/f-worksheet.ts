/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CustomData, ICellData, IColumnData, IDisposable, IFreeze, IObjectArrayPrimitiveType, IRange, IRowData, IStyleData, Nullable, Workbook, Worksheet } from '@univerjs/core';
import type { ISetColDataCommandParams, ISetGridlinesColorCommandParams, ISetRangeValuesMutationParams, ISetRowDataCommandParams, IToggleGridlinesCommandParams } from '@univerjs/sheets';
import type { FDefinedName } from './f-defined-name';
import type { FWorkbook } from './f-workbook';
import { BooleanNumber, Direction, FBase, ICommandService, ILogService, Inject, Injector, ObjectMatrix, RANGE_TYPE } from '@univerjs/core';
import { deserializeRangeWithSheet } from '@univerjs/engine-formula';
import { CancelFrozenCommand, ClearSelectionAllCommand, ClearSelectionContentCommand, ClearSelectionFormatCommand, copyRangeStyles, InsertColCommand, InsertRowCommand, MoveColsCommand, MoveRowsCommand, RemoveColCommand, RemoveRowCommand, SetColDataCommand, SetColHiddenCommand, SetColWidthCommand, SetFrozenCommand, SetGridlinesColorCommand, SetRangeValuesMutation, SetRowDataCommand, SetRowHeightCommand, SetRowHiddenCommand, SetSpecificColsVisibleCommand, SetSpecificRowsVisibleCommand, SetTabColorCommand, SetWorksheetDefaultStyleMutation, SetWorksheetHideCommand, SetWorksheetNameCommand, SetWorksheetRowIsAutoHeightCommand, SetWorksheetShowCommand, SheetsSelectionsService, ToggleGridlinesCommand } from '@univerjs/sheets';
import { FDefinedNameBuilder } from './f-defined-name';
import { FRange } from './f-range';
import { FSelection } from './f-selection';
import { covertToColRange, covertToRowRange } from './utils';

interface IFacadeClearOptions {
    contentsOnly?: boolean;
    formatOnly?: boolean;
}

/**
 * Represents a worksheet facade api instance. Which provides a set of methods to interact with the worksheet.
 */
export class FWorksheet extends FBase {
    constructor(
        protected readonly _fWorkbook: FWorkbook,
        protected readonly _workbook: Workbook,
        protected readonly _worksheet: Worksheet,
        @Inject(Injector) protected readonly _injector: Injector,
        @Inject(SheetsSelectionsService) protected readonly _selectionManagerService: SheetsSelectionsService,
        @Inject(ILogService) protected readonly _logService: ILogService,
        @ICommandService protected readonly _commandService: ICommandService
    ) {
        super();
    }

    /**
     * Returns the injector
     * @returns The injector
     */
    getInject(): Injector {
        return this._injector;
    }

    /**
     * Returns the workbook
     * @returns {Workbook} The workbook instance.
     */
    getWorkbook(): Workbook {
        return this._workbook;
    }

    /**
     * Returns the worksheet id.
     * @returns {string} The id of the worksheet.
     */
    getSheetId(): string {
        return this._worksheet.getSheetId();
    }

    /**
     * Returns the worksheet name.
     * @returns {string} The name of the worksheet.
     */
    getSheetName(): string {
        return this._worksheet.getName();
    }

    /**
     * Represents the selection ranges info of the worksheet.
     * @returns {FSelection} return the current selections of the worksheet or null if there is no selection.
     */
    getSelection(): FSelection | null {
        const selections = this._selectionManagerService.getCurrentSelections();
        if (!selections) {
            return null;
        }

        return this._injector.createInstance(FSelection, this._workbook, this._worksheet, selections);
    }

    // #region rows

    // #region default style

    /**
     * Get the default style of the worksheet
     * @returns {IStyleData} Default style of the worksheet.
     */
    getDefaultStyle(): Nullable<IStyleData> | string {
        return this._worksheet.getDefaultCellStyle();
    }

    /**
     * Get the default style of the worksheet row
     * @param {number} index The row index
     * @param {boolean} [keepRaw] If true, return the raw style data maybe the style name or style data, otherwise return the data from row manager
     * @returns {Nullable<IStyleData> | string} The default style of the worksheet row name or style data
     */
    getRowDefaultStyle(index: number, keepRaw: boolean = false): Nullable<IStyleData> | string {
        return this._worksheet.getRowStyle(index, keepRaw);
    }

    /**
     * Get the default style of the worksheet column
     * @param {number} index The column index
     * @param  {boolean} [keepRaw] If true, return the raw style data maybe the style name or style data, otherwise return the data from col manager
     * @returns {Nullable<IStyleData> | string} The default style of the worksheet column name or style data
     */
    getColumnDefaultStyle(index: number, keepRaw: boolean = false): Nullable<IStyleData> | string {
        return this._worksheet.getColumnStyle(index, keepRaw);
    }

    /**
     * Set the default style of the worksheet
     * @param {StyleDataInfo} style default style
     * @returns {Promise<FWorksheet>} This sheet, for chaining.
     */
    async setDefaultStyle(style: string): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        await this._commandService.executeCommand(SetWorksheetDefaultStyleMutation.id, {
            unitId,
            subUnitId,
            defaultStyle: style,
        });
        this._worksheet.setDefaultCellStyle(style);
        return this;
    }

    /**
     * Set the default style of the worksheet row
     * @param {number} index The row index
     * @param {string | Nullable<IStyleData>} style The style name or style data
     * @returns {Promise<FWorksheet>} This sheet, for chaining.
     */
    async setColumnDefaultStyle(index: number, style: string | Nullable<IStyleData>): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();

        const params: ISetColDataCommandParams = {
            unitId,
            subUnitId,
            columnData: {
                [index]: {
                    s: style,
                },
            },
        };

        await this._commandService.executeCommand(SetColDataCommand.id, params);
        return this;
    }

    /**
     * Set the default style of the worksheet column
     * @param {number} index The column index
     * @param {string | Nullable<IStyleData>} style The style name or style data
     * @returns {Promise<FWorksheet>} This sheet, for chaining.
     */
    async setRowDefaultStyle(index: number, style: string | Nullable<IStyleData>): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();

        const params: ISetRowDataCommandParams = {
            unitId,
            subUnitId,
            rowData: {
                [index]: {
                    s: style,
                },
            },
        };

        await this._commandService.executeCommand(SetRowDataCommand.id, params);
        return this;
    }

    // #endregion

    /**
     * Returns a Range object representing a single cell at the specified row and column.
     * @param row The row index of the cell.
     * @param column The column index of the cell.
     * @returns A Range object representing the specified cell.
     */
    getRange(row: number, column: number): FRange;
    /**
     * Returns a Range object representing a range starting at the specified row and column, with the specified number of rows.
     * @param row The starting row index of the range.
     * @param column The starting column index of the range.
     * @param numRows The number of rows in the range.
     * @returns A Range object representing the specified range.
     */
    getRange(row: number, column: number, numRows: number): FRange;
    /**
     * Returns a Range object representing a range starting at the specified row and column, with the specified number of rows and columns.
     * @param row The starting row index of the range.
     * @param column The starting column index of the range.
     * @param numRows The number of rows in the range.
     * @param numColumns The number of columns in the range.
     * @returns A Range object representing the specified range.
     */
    getRange(row: number, column: number, numRows: number, numColumns: number): FRange;
    /**
     * Returns a Range object specified by A1 notation.
     * @param a1Notation A string representing a range in A1 notation.
     * @returns A Range object representing the specified range.
     */
    getRange(a1Notation: string): FRange;
    getRange(rowOrA1Notation: number | string, column?: number, numRows?: number, numColumns?: number): FRange {
        let range: IRange;
        let sheet: Worksheet;

        if (typeof rowOrA1Notation === 'string') {
            // A1 notation
            const { range: parsedRange, sheetName } = deserializeRangeWithSheet(rowOrA1Notation);

            const rangeSheet = sheetName ? this._workbook.getSheetBySheetName(sheetName) : this._worksheet;
            if (!rangeSheet) {
                throw new Error('Range not found');
            }
            sheet = rangeSheet;

            range = {
                ...parsedRange,
                unitId: this._workbook.getUnitId(),
                sheetId: sheet.getSheetId(),
                // Use the current range instead of the future actual range to match Apps Script behavior.
                // Users can create the latest range in real time when needed.
                rangeType: RANGE_TYPE.NORMAL,
                startRow: parsedRange.rangeType === RANGE_TYPE.COLUMN ? 0 : parsedRange.startRow,
                endRow: parsedRange.rangeType === RANGE_TYPE.COLUMN ? sheet.getMaxRows() - 1 : parsedRange.endRow,
                startColumn: parsedRange.rangeType === RANGE_TYPE.ROW ? 0 : parsedRange.startColumn,
                endColumn: parsedRange.rangeType === RANGE_TYPE.ROW ? sheet.getMaxColumns() - 1 : parsedRange.endColumn,
            };
        } else if (typeof rowOrA1Notation === 'number' && column !== undefined) {
            sheet = this._worksheet;
            // Range
            range = {
                startRow: rowOrA1Notation,
                endRow: rowOrA1Notation + (numRows ?? 1) - 1,
                startColumn: column,
                endColumn: column + (numColumns ?? 1) - 1,
                unitId: this._workbook.getUnitId(),
                sheetId: this._worksheet.getSheetId(),
            };
        } else {
            throw new Error('Invalid range specification');
        }

        return this._injector.createInstance(FRange, this._workbook, sheet, range);
    }

    /**
     * Returns the current number of columns in the sheet, regardless of content.
     * @return The maximum columns count of the sheet
     */
    getMaxColumns(): number {
        return this._worksheet.getMaxColumns();
    }

    /**
     * Returns the current number of rows in the sheet, regardless of content.
     * @return The maximum rows count of the sheet
     */
    getMaxRows(): number {
        return this._worksheet.getMaxRows();
    }

    /**
     * Inserts a row after the given row position.
     * @param afterPosition The row after which the new row should be added, starting at 0 for the first row.
     * @returns This sheet, for chaining.
     */
    async insertRowAfter(afterPosition: number): Promise<FWorksheet> {
        return this.insertRowsAfter(afterPosition, 1);
    }

    /**
     * Inserts a row before the given row position.
     * @param beforePosition The row before which the new row should be added, starting at 0 for the first row.
     * @returns This sheet, for chaining.
     */
    async insertRowBefore(beforePosition: number): Promise<FWorksheet> {
        return this.insertRowsBefore(beforePosition, 1);
    }

    /**
     * Inserts one or more consecutive blank rows in a sheet starting at the specified location.
     * @param rowIndex The index indicating where to insert a row, starting at 0 for the first row.
     * @param numRows The number of rows to insert.
     * @returns This sheet, for chaining.
     */
    async insertRows(rowIndex: number, numRows: number = 1): Promise<FWorksheet> {
        return this.insertRowsBefore(rowIndex, numRows);
    }

    /**
     * Inserts a number of rows after the given row position.
     * @param afterPosition The row after which the new rows should be added, starting at 0 for the first row.
     * @param howMany The number of rows to insert.
     * @returns This sheet, for chaining.
     */
    async insertRowsAfter(afterPosition: number, howMany: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const direction = Direction.DOWN;

        const startRow = afterPosition + 1;
        const endRow = afterPosition + howMany;
        const startColumn = 0;
        const endColumn = this._worksheet.getColumnCount() - 1;

        // copy styles of the row below
        const cellValue = copyRangeStyles(this._worksheet, startRow, endRow, startColumn, endColumn, true, afterPosition);

        await this._commandService.executeCommand(InsertRowCommand.id, {
            unitId,
            subUnitId,
            direction,
            range: {
                startRow,
                endRow,
                startColumn,
                endColumn,
            },
            cellValue,
        });

        return this;
    }

    /**
     * Inserts a number of rows before the given row position.
     * @param beforePosition The row before which the new rows should be added, starting at 0 for the first row.
     * @param howMany The number of rows to insert.
     * @returns This sheet, for chaining.
     */
    async insertRowsBefore(beforePosition: number, howMany: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const direction = Direction.UP;

        const startRow = beforePosition;
        const endRow = beforePosition + howMany - 1;
        const startColumn = 0;
        const endColumn = this._worksheet.getColumnCount() - 1;

        // copy styles of the row above
        const cellValue = copyRangeStyles(this._worksheet, startRow, endRow, startColumn, endColumn, true, beforePosition - 1);

        await this._commandService.executeCommand(InsertRowCommand.id, {
            unitId,
            subUnitId,
            direction,
            range: {
                startRow,
                endRow,
                startColumn,
                endColumn,
            },
            cellValue,
        });

        return this;
    }

    /**
     * Deletes the row at the given row position.
     * @param rowPosition The position of the row, starting at 0 for the first row.
     * @returns This sheet, for chaining.
     */
    async deleteRow(rowPosition: number): Promise<FWorksheet> {
        return this.deleteRows(rowPosition, 1);
    }

    /**
     * Deletes a number of rows starting at the given row position.
     * @param rowPosition The position of the first row to delete, starting at 0 for the first row.
     * @param howMany The number of rows to delete.
     * @returns This sheet, for chaining.
     */
    async deleteRows(rowPosition: number, howMany: number): Promise<FWorksheet> {
        const range = {
            startRow: rowPosition,
            endRow: rowPosition + howMany - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
        };

        await this._commandService.executeCommand(RemoveRowCommand.id, {
            range,
        });

        return this;
    }

    /**
     * Moves the rows selected by the given range to the position indicated by the destinationIndex. The rowSpec itself does not have to exactly represent an entire row or group of rows to move—it selects all rows that the range spans.
     * @param rowSpec A range spanning the rows that should be moved.
     * @param destinationIndex The index that the rows should be moved to. Note that this index is based on the coordinates before the rows are moved. Existing data is shifted down to make room for the moved rows while the source rows are removed from the grid. Therefore, the data may end up at a different index than originally specified. Use 0-index for this method.
     * @returns This sheet, for chaining.
     */
    async moveRows(rowSpec: FRange, destinationIndex: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToRowRange(rowSpec.getRange(), this._worksheet);
        const fromRange = range;
        const toRange = {
            startRow: destinationIndex,
            endRow: destinationIndex,
            startColumn: range.startColumn,
            endColumn: range.endColumn,
        };

        await this._commandService.executeCommand(MoveRowsCommand.id, {
            unitId,
            subUnitId,
            range,
            fromRange,
            toRange,
        });

        return this;
    }

    /**
     * Hides the rows in the given range.
     * @param row The row range to hide.
     * @returns This sheet, for chaining.
     */
    async hideRow(row: FRange): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToRowRange(row.getRange(), this._worksheet);

        await this._commandService.executeCommand(SetRowHiddenCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Hides one or more consecutive rows starting at the given index. Use 0-index for this method.
     * @param rowIndex The starting index of the rows to hide.
     * @param numRows The number of rows to hide.
     * @returns This sheet, for chaining.
     */
    async hideRows(rowIndex: number, numRows: number = 1): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range: IRange = {
            startRow: rowIndex,
            endRow: rowIndex + numRows - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
            rangeType: RANGE_TYPE.ROW,
        };

        await this._commandService.executeCommand(SetRowHiddenCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });
        return this;
    }

    /**
     * Unhides the row in the given range.
     * @param row The range to unhide, if hidden.
     * @returns This sheet, for chaining.
     */
    async unhideRow(row: FRange): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToRowRange(row.getRange(), this._worksheet);

        await this._commandService.executeCommand(SetSpecificRowsVisibleCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Unhides one or more consecutive rows starting at the given index. Use 0-index for this method.
     * @param rowIndex The starting index of the rows to unhide.
     * @param numRows The number of rows to unhide.
     * @returns This sheet, for chaining.
     */
    async showRows(rowIndex: number, numRows: number = 1): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range: IRange = {
            startRow: rowIndex,
            endRow: rowIndex + numRows - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
            rangeType: RANGE_TYPE.ROW,
        };

        await this._commandService.executeCommand(SetSpecificRowsVisibleCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Sets the row height of the given row in pixels. By default, rows grow to fit cell contents. If you want to force rows to a specified height, use setRowHeightsForced(startRow, numRows, height).
     * @param rowPosition The row position to change.
     * @param height The height in pixels to set it to.
     * @returns This sheet, for chaining.
     */
    async setRowHeight(rowPosition: number, height: number): Promise<FWorksheet> {
        return this.setRowHeights(rowPosition, 1, height);
    }

    /**
     * Sets the height of the given rows in pixels. By default, rows grow to fit cell contents. If you want to force rows to a specified height, use setRowHeightsForced(startRow, numRows, height).
     * @param startRow The starting row position to change.
     * @param numRows The number of rows to change.
     * @param height The height in pixels to set it to.
     * @returns This sheet, for chaining.
     */
    async setRowHeights(startRow: number, numRows: number, height: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const rowManager = this._worksheet.getRowManager();

        const autoHeightRanges: IRange[] = [];
        const rowHeightRanges: IRange[] = [];

        for (let i = startRow; i < startRow + numRows; i++) {
            const autoRowHeight = rowManager.getRow(i)?.ah || this._worksheet.getConfig().defaultRowHeight;
            const range = {
                startRow: i,
                endRow: i,
                startColumn: 0,
                endColumn: this._worksheet.getColumnCount() - 1,
            };

            // if the new height is less than the current height, set auto height
            if (height <= autoRowHeight) {
                autoHeightRanges.push(range);
            } else { // if the new height is greater than the current height, set the new height
                rowHeightRanges.push(range);
            }
        }

        if (rowHeightRanges.length > 0) {
            await this._commandService.executeCommand(SetRowHeightCommand.id, {
                unitId,
                subUnitId,
                ranges: rowHeightRanges,
                value: height,
            });
        }

        if (autoHeightRanges.length > 0) {
            await this._commandService.executeCommand(SetWorksheetRowIsAutoHeightCommand.id, {
                unitId,
                subUnitId,
                ranges: autoHeightRanges,
            });
        }

        return this;
    }

    /**
     * Sets the height of the given rows in pixels. By default, rows grow to fit cell contents. When you use setRowHeightsForced, rows are forced to the specified height even if the cell contents are taller than the row height.
     * @param startRow The starting row position to change.
     * @param numRows The number of rows to change.
     * @param height The height in pixels to set it to.
     * @returns This sheet, for chaining.
     */
    async setRowHeightsForced(startRow: number, numRows: number, height: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const ranges = [
            {
                startRow,
                endRow: startRow + numRows - 1,
                startColumn: 0,
                endColumn: this._worksheet.getColumnCount() - 1,
            },
        ];

        await this._commandService.executeCommand(SetRowHeightCommand.id, {
            unitId,
            subUnitId,
            ranges,
            value: height,
        });

        return this;
    }

    // #endregion

    /**
     * Set custom properties for given rows.
     * @param custom The custom properties to set.
     * @returns This sheet, for chaining.
     */
    async setRowCustom(custom: IObjectArrayPrimitiveType<CustomData>): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();

        const rowData: IObjectArrayPrimitiveType<Nullable<IRowData>> = {};
        for (const [rowIndex, customData] of Object.entries(custom)) {
            rowData[Number(rowIndex)] = {
                custom: customData,
            };
        }

        const params: ISetRowDataCommandParams = {
            unitId,
            subUnitId,
            rowData,
        };

        await this._commandService.executeCommand(SetRowDataCommand.id, params);

        return this;
    }

    // #region Column

    /**
     * Inserts a column after the given column position.
     * @param afterPosition The column after which the new column should be added, starting at 0 for the first column.
     * @returns This sheet, for chaining.
     */
    async insertColumnAfter(afterPosition: number): Promise<FWorksheet> {
        return this.insertColumnsAfter(afterPosition, 1);
    }

    /**
     * Inserts a column before the given column position.
     * @param beforePosition The column before which the new column should be added, starting at 0 for the first column.
     * @returns This sheet, for chaining.
     */
    async insertColumnBefore(beforePosition: number): Promise<FWorksheet> {
        return this.insertColumnsBefore(beforePosition, 1);
    }

    /**
     * Inserts one or more consecutive blank columns in a sheet starting at the specified location.
     * @param columnIndex The index indicating where to insert a column, starting at 0 for the first column.
     * @param numColumns The number of columns to insert.
     * @returns This sheet, for chaining.
     */
    async insertColumns(columnIndex: number, numColumns: number = 1): Promise<FWorksheet> {
        return this.insertColumnsBefore(columnIndex, numColumns);
    }

    /**
     * Inserts a given number of columns after the given column position.
     * @param afterPosition The column after which the new column should be added, starting at 0 for the first column.
     * @param howMany The number of columns to insert.
     * @returns This sheet, for chaining.
     */
    async insertColumnsAfter(afterPosition: number, howMany: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const direction = Direction.RIGHT;

        const startRow = 0;
        const endRow = this._worksheet.getRowCount() - 1;
        const startColumn = afterPosition + 1;
        const endColumn = afterPosition + howMany;

        // copy styles of the column to the right
        const cellValue = copyRangeStyles(this._worksheet, startRow, endRow, startColumn, endColumn, false, afterPosition);

        await this._commandService.executeCommand(InsertColCommand.id, {
            unitId,
            subUnitId,
            direction,
            range: {
                startRow,
                endRow,
                startColumn,
                endColumn,
            },
            cellValue,
        });

        return this;
    }

    /**
     * Inserts a number of columns before the given column position.
     * @param beforePosition The column before which the new column should be added, starting at 0 for the first column.
     * @param howMany The number of columns to insert.
     * @returns This sheet, for chaining.
     */
    async insertColumnsBefore(beforePosition: number, howMany: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const direction = Direction.LEFT;

        const startRow = 0;
        const endRow = this._worksheet.getRowCount() - 1;
        const startColumn = beforePosition;
        const endColumn = beforePosition + howMany - 1;

        // copy styles of the column to the left
        const cellValue = copyRangeStyles(this._worksheet, startRow, endRow, startColumn, endColumn, false, beforePosition - 1);

        await this._commandService.executeCommand(InsertColCommand.id, {
            unitId,
            subUnitId,
            direction,
            range: {
                startRow,
                endRow,
                startColumn,
                endColumn,
            },
            cellValue,
        });

        return this;
    }

    /**
     * Deletes the column at the given column position.
     * @param columnPosition The position of the column, starting at 0 for the first column.
     * @returns This sheet, for chaining.
     */
    async deleteColumn(columnPosition: number): Promise<FWorksheet> {
        return this.deleteColumns(columnPosition, 1);
    }

    /**
     * Deletes a number of columns starting at the given column position.
     * @param columnPosition The position of the first column to delete, starting at 0 for the first column.
     * @param howMany The number of columns to delete.
     * @returns This sheet, for chaining.
     */
    async deleteColumns(columnPosition: number, howMany: number): Promise<FWorksheet> {
        const range = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: columnPosition,
            endColumn: columnPosition + howMany - 1,
        };

        await this._commandService.executeCommand(RemoveColCommand.id, {
            range,
        });

        return this;
    }

    /**
     * Moves the columns selected by the given range to the position indicated by the destinationIndex. The columnSpec itself does not have to exactly represent an entire column or group of columns to move—it selects all columns that the range spans.
     * @param columnSpec A range spanning the columns that should be moved.
     * @param destinationIndex The index that the columns should be moved to. Note that this index is based on the coordinates before the columns are moved. Existing data is shifted right to make room for the moved columns while the source columns are removed from the grid. Therefore, the data may end up at a different index than originally specified. Use 0-index for this method.
     * @returns This sheet, for chaining.
     */
    async moveColumns(columnSpec: FRange, destinationIndex: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToColRange(columnSpec.getRange(), this._worksheet);
        const fromRange = range;
        const toRange = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: destinationIndex,
            endColumn: destinationIndex,
        };

        await this._commandService.executeCommand(MoveColsCommand.id, {
            unitId,
            subUnitId,
            range,
            fromRange,
            toRange,
        });

        return this;
    }

    /**
     * Hides the column or columns in the given range.
     * @param column The column range to hide.
     * @returns This sheet, for chaining.
     */
    async hideColumn(column: FRange): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToColRange(column.getRange(), this._worksheet);

        await this._commandService.executeCommand(SetColHiddenCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Hides one or more consecutive columns starting at the given index. Use 0-index for this method.
     * @param columnIndex The starting index of the columns to hide.
     * @param numColumns The number of columns to hide.
     * @returns This sheet, for chaining.
     */
    async hideColumns(columnIndex: number, numColumns: number = 1): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range: IRange = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: columnIndex,
            endColumn: columnIndex + numColumns - 1,
            rangeType: RANGE_TYPE.COLUMN,
        };

        await this._commandService.executeCommand(SetColHiddenCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Unhides the column in the given range.
     * @param column The range to unhide, if hidden.
     * @returns This sheet, for chaining.
     */
    async unhideColumn(column: FRange): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range = covertToColRange(column.getRange(), this._worksheet);

        await this._commandService.executeCommand(SetSpecificColsVisibleCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Unhides one or more consecutive columns starting at the given index. Use 0-index for this method.
     * @param columnIndex The starting index of the columns to unhide.
     * @param numColumns The number of columns to unhide.
     * @returns This sheet, for chaining.
     */
    async showColumns(columnIndex: number, numColumns: number = 1): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const range: IRange = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: columnIndex,
            endColumn: columnIndex + numColumns - 1,
            rangeType: RANGE_TYPE.COLUMN,
        };

        await this._commandService.executeCommand(SetSpecificColsVisibleCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });

        return this;
    }

    /**
     * Sets the width of the given column in pixels.
     * @param columnPosition The position of the given column to set.
     * @param width The width in pixels to set it to.
     * @returns This sheet, for chaining.
     */
    async setColumnWidth(columnPosition: number, width: number): Promise<FWorksheet> {
        return this.setColumnWidths(columnPosition, 1, width);
    }

    /**
     * Sets the width of the given columns in pixels.
     * @param startColumn The starting column position to change.
     * @param numColumns The number of columns to change.
     * @param width The width in pixels to set it to.
     * @returns This sheet, for chaining.
     */
    async setColumnWidths(startColumn: number, numColumns: number, width: number): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const ranges = [
            {
                startColumn,
                endColumn: startColumn + numColumns - 1,
                startRow: 0,
                endRow: this._worksheet.getRowCount() - 1,
            },
        ];

        await this._commandService.executeCommand(SetColWidthCommand.id, {
            unitId,
            subUnitId,
            ranges,
            value: width,
        });

        return this;
    }

    // #endregion

    /**
     * Set custom properties for given columns.
     * @param custom The custom properties to set.
     * @returns This sheet, for chaining.
     */
    async setColumnCustom(custom: IObjectArrayPrimitiveType<CustomData>): Promise<FWorksheet> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();

        const columnData: IObjectArrayPrimitiveType<Nullable<IColumnData>> = {};
        for (const [columnIndex, customData] of Object.entries(custom)) {
            columnData[Number(columnIndex)] = {
                custom: customData,
            };
        }

        const params: ISetColDataCommandParams = {
            unitId,
            subUnitId,
            columnData,
        };

        await this._commandService.executeCommand(SetColDataCommand.id, params);

        return this;
    }

    // #region merge cells

    /**
     * Get all merged cells in the current sheet
     * @returns all merged cells
     */
    getMergedRanges(): FRange[] {
        const snapshot = this._worksheet.getSnapshot();
        return snapshot.mergeData.map((merge) => this._injector.createInstance(FRange, this._workbook, this._worksheet, merge));
    }

    /**
     * Get the merged cell data of the specified row and column.
     * @param {number} row The row index.
     * @param {number} column The column index.
     * @returns {FRange|undefined} The merged cell data, or undefined if the cell is not merged.
     */
    getCellMergeData(row: number, column: number): FRange | undefined {
        const worksheet = this._worksheet;
        const mergeData = worksheet.getMergedCell(row, column);
        if (mergeData) {
            return this._injector.createInstance(FRange, this._workbook, this._worksheet, mergeData);
        }
    }

    // #endregion

    /**
     * Returns the selected range in the active sheet, or null if there is no active range.
     * @returns the active range
     */
    getActiveRange(): FRange | null {
        return this._fWorkbook.getActiveRange();
    }

    /**
     * Sets the active selection region for this sheet.
     * @param range The range to set as the active selection.
     */
    setActiveRange(range: FRange): void {
        const { unitId, sheetId } = range.getRange();

        if (unitId !== this._workbook.getUnitId() || sheetId !== this._worksheet.getSheetId()) {
            throw new Error('Specified range must be part of the sheet.');
        }

        this._fWorkbook.setActiveRange(range);
    }

    /**
     * Sets the active selection region for this sheet.
     * @param range The range to set as the active selection.
     */
    setActiveSelection = this.setActiveRange;

    /**
     * Sets the frozen state of the current sheet.
     * @param freeze - the scrolling viewport start range and count of freezed rows and columns.
     * that means if you want to freeze the first 3 rows and 2 columns, you should set freeze as { startRow: 3, startColumn: 2, xSplit: 2, ySplit: 3 }
     *
     * @deprecated use `setFrozenRows` and `setFrozenColumns` instead.
     * @returns True if the command was successful, false otherwise.
     */
    setFreeze(freeze: IFreeze): boolean {
        this._logService.warn('setFreeze is deprecated, use setFrozenRows and setFrozenColumns instead');
        return this._commandService.syncExecuteCommand(SetFrozenCommand.id, {
            ...freeze,
            unitId: this._workbook.getUnitId(),
            subUnitId: this.getSheetId(),
        });
    }

    /**
     * Cancels the frozen state of the current sheet.
     * @returns True if the command was successful, false otherwise.
     */
    cancelFreeze(): boolean {
        // TODO: this command should not be implemented in sheets-ui package
        return this._commandService.syncExecuteCommand(CancelFrozenCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this.getSheetId(),
        });
    }

    /**
     * Get the freeze state of the current sheet.
     * @returns The freeze state of the current sheet.
     *
     * @deprecated use `getRowFreezeStatus` and `getColumnFreezeStatus` instead.
     */
    getFreeze(): IFreeze {
        return this._worksheet.getFreeze();
    }

    /**
     * Set the number of frozen columns.
     * @param columns The number of columns to freeze.
     * To unfreeze all columns, set this value to 0.
     */
    setFrozenColumns(columns: number): void;
    /**
     * Set freeze column, then the range from startColumn to endColumn will be fixed.
     * e.g. setFrozenColumns(0, 2) will fix the column range from 0 to 2.
     * e.g. setFrozenColumns(2, 3) will fix the column range from 2 to 3, And column from 0 to 1 will be invisible.
     *
     * @example
     * ``` ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // freeze the first too columns.
     * fWorkSheet.setFrozenColumns(0, 2);
     * ```
     * @param startColumn
     * @param endColumn
     */
    setFrozenColumns(startColumn: number, endColumn: number): void;
    setFrozenColumns(...args: [number] | [number, number]): void {
        const freezeCfg = this.getFreeze();
        if (arguments.length === 1) {
            const columns = args[0];
            this.setFreeze({
                ...freezeCfg,
                startColumn: columns > 0 ? columns : -1,
                xSplit: columns,
            });
        } else if (arguments.length === 2) {
            let [startColumn = 0, endColumn = 0] = args;
            if (startColumn > endColumn) {
                [startColumn, endColumn] = [endColumn, startColumn];
            }
            this._commandService.syncExecuteCommand(SetFrozenCommand.id, {
                startColumn: endColumn + 1,
                xSplit: endColumn - startColumn + 1,
                startRow: freezeCfg.startRow,
                ySplit: freezeCfg.ySplit,
                unitId: this._workbook.getUnitId(),
                subUnitId: this.getSheetId(),
            });
        }
    }

    /**
     * Set the number of frozen rows.
     * @param rows The number of rows to freeze.
     * To unfreeze all rows, set this value to 0.
     */
    setFrozenRows(rows: number): void;

    /**
     * Set freeze row, then the range from startRow to endRow will be fixed.
     * e.g. setFrozenRows(0, 2) will fix the row range from 0 to 2.
     * e.g. setFrozenRows(2, 3) will fix the row range from 2 to 3, And row from 0 to 1 will be invisible.
     * @param startRow
     * @param endRow
     *
     * @example
     * ``` ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // freeze the first too rows.
     * fWorkSheet.setFrozenRows(0, 2);
     * ```
     */
    setFrozenRows(startColumn: number, endColumn: number): void;
    setFrozenRows(...args: [number] | [number, number]): void {
        const freezeCfg = this.getFreeze();
        if (arguments.length === 1) {
            const rows = args[0];
            this.setFreeze({
                ...freezeCfg,
                startRow: rows > 0 ? rows : -1,
                ySplit: rows,
            });
        } else if (arguments.length === 2) {
            let [startRow = 0, endRow = 0] = args;
            if (startRow > endRow) {
                [startRow, endRow] = [endRow, startRow];
            }
            this._commandService.syncExecuteCommand;
            this._commandService.syncExecuteCommand(SetFrozenCommand.id, {
                startRow: endRow + 1,
                ySplit: endRow - startRow + 1,
                startColumn: freezeCfg.startColumn,
                xSplit: freezeCfg.xSplit,
                unitId: this._workbook.getUnitId(),
                subUnitId: this.getSheetId(),
            });
        }
    }

    /**
     * Get the number of frozen columns.
     * @returns The number of frozen columns.
     * Returns 0 if no columns are frozen.
     */
    getFrozenColumns(): number {
        const freeze = this.getFreeze();
        if (freeze.startColumn === -1) {
            return 0;
        }
        return freeze.startColumn;
    }

    /**
     * Get the number of frozen rows.
     * @returns The number of frozen rows.
     * Returns 0 if no rows are frozen.
     */
    getFrozenRows(): number {
        const freeze = this.getFreeze();
        if (freeze.startRow === -1) {
            return 0;
        }
        return freeze.startRow;
    }

    /**
     * Get freezed rows.
     */
    getFrozenRowRange(): { startRow: number; endRow: number } {
        const cfg = this._worksheet.getFreeze();
        return {
            startRow: cfg.startRow - cfg.ySplit,
            endRow: cfg.startRow - 1,
        };
    }

    /**
     * Get freezed columns
     */
    getFrozenColumnRange(): { startColumn: number; endColumn: number } {
        const cfg = this._worksheet.getFreeze();
        return {
            startColumn: cfg.startColumn - cfg.xSplit,
            endColumn: cfg.startColumn - 1,
        };
    }

    /**
     * Returns true if the sheet's gridlines are hidden; otherwise returns false. Gridlines are visible by default.
     * @returns {boolean} True if the sheet's gridlines are hidden; otherwise false.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // check if the gridlines are hidden
     * if (fWorkSheet.hasHiddenGridLines()) {
     *    console.log('Gridlines are hidden');
     * }
     * ```
     */
    hasHiddenGridLines(): boolean {
        return this._worksheet.getConfig().showGridlines === BooleanNumber.FALSE;
    }

    /**
     * Hides or reveals the sheet gridlines.
     * @param {boolean} hidden If `true`, hide gridlines in this sheet; otherwise show the gridlines.
     * @example
     * ``` ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // hide the gridlines
     * fWorkSheet.setHiddenGridlines(true);
     * ```
     */
    setHiddenGridlines(hidden: boolean): Promise<boolean> {
        return this._commandService.executeCommand(ToggleGridlinesCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
            showGridlines: hidden ? BooleanNumber.FALSE : BooleanNumber.TRUE,
        } as IToggleGridlinesCommandParams);
    }

    /**
     * Set the color of the gridlines in the sheet.
     * @param {string|undefined} color The color to set for the gridlines.Undefined or null to reset to the default color.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // set the gridlines color to red
     * fWorkSheet.setGridLinesColor('#ff0000');
     * ```
     */
    setGridLinesColor(color: string | undefined): Promise<boolean> {
        return this._commandService.executeCommand(SetGridlinesColorCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
            color,
        } as ISetGridlinesColorCommandParams);
    }

    /**
     * Get the color of the gridlines in the sheet.
     * @returns {string | undefined} The color of the gridlines in the sheet or undefined. The default color is 'rgb(214, 216, 219)'.
     */
    getGridLinesColor(): string | undefined {
        return this._worksheet.getGridlinesColor() as string | undefined;
    }

    /**
     * Sets the sheet tab color.
     * @param {string|null|undefined} color A color code in CSS notation (like '#ffffff' or 'white'), or null to reset the tab color.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // set the tab color to red
     * fWorkSheet.setTabColor('#ff0000');
     * ```
     */
    setTabColor(color: string): Promise<boolean> {
        return this._commandService.executeCommand(SetTabColorCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
            color,
        });
    }

    /**
     * Get the tab color of the sheet.
     * @returns {string} The tab color of the sheet or undefined.
     * The default color is css style property 'unset'.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // get the tab color of the sheet
     * console.log(fWorkSheet.getTabColor());
     * ```
     */
    getTabColor(): string | undefined {
        return this._worksheet.getTabColor() as string | undefined;
    }

    /**
     * Subscribe to the cell data change event.
     * @param callback - The callback function to be executed when the cell data changes.
     * @returns - A disposable object to unsubscribe from the event.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // subscribe to the cell data change event
     * const disposable = fWorkSheet.onCellDataChange((cellValue) => {
     *  console.log(cellValue.toArray());
     * });
     * // unsubscribe from the event
     * disposable.dispose();
     * ```
     */
    onCellDataChange(callback: (cellValue: ObjectMatrix<Nullable<ICellData>>) => void): IDisposable {
        const commandService = this._injector.get(ICommandService);
        return commandService.onCommandExecuted((command) => {
            if (command.id === SetRangeValuesMutation.id) {
                const params = command.params as ISetRangeValuesMutationParams;
                if (
                    params.unitId === this._workbook.getUnitId() &&
                    params.subUnitId === this._worksheet.getSheetId() &&
                    params.cellValue
                ) {
                    callback(new ObjectMatrix(params.cellValue));
                }
            }
        });
    }

    /**
     * Subscribe to the cell data change event.
     * @param callback - The callback function to be executed before the cell data changes.
     * @returns - A disposable object to unsubscribe from the event.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // subscribe to the cell data change event
     * const disposable = fWorkSheet.onBeforeCellDataChange((cellValue) => {
     *   console.log(cellValue.toArray());
     * });
     * // unsubscribe from the event
     * disposable.dispose();
     * ```
     */
    onBeforeCellDataChange(callback: (cellValue: ObjectMatrix<Nullable<ICellData>>) => void): IDisposable {
        const commandService = this._injector.get(ICommandService);
        return commandService.beforeCommandExecuted((command) => {
            if (command.id === SetRangeValuesMutation.id) {
                const params = command.params as ISetRangeValuesMutationParams;
                if (params.unitId === this._workbook.getUnitId() && params.subUnitId === this._worksheet.getSheetId() && params.cellValue) {
                    callback(new ObjectMatrix(params.cellValue));
                }
            }
        });
    }

    /**
     * Hides this sheet. Has no effect if the sheet is already hidden. If this method is called on the only visible sheet, it throws an exception.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // hide the active sheet
     * fWorkSheet.hideSheet();
     * ``
     */
    hideSheet(): void {
        const commandService = this._injector.get(ICommandService);
        const workbook = this._workbook;
        const sheets = workbook.getSheets();
        const visibleSheets = sheets.filter((sheet) => sheet.isSheetHidden() !== BooleanNumber.TRUE);
        if (visibleSheets.length <= 1) {
            throw new Error('Cannot hide the only visible sheet');
        }

        commandService.executeCommand(SetWorksheetHideCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
        });
    }

    /**
     * Shows this sheet. Has no effect if the sheet is already visible.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheets = fWorkbook.getSheets();
     * // show the last sheet
     * fWorkSheets[fWorkSheets.length - 1].showSheet();
     * ```
     */
    showSheet(): Promise<boolean> {
        const commandService = this._injector.get(ICommandService);
        return commandService.executeCommand(SetWorksheetShowCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
        });
    }

    /**
     * Returns true if the sheet is currently hidden.
     * @returns {boolean} True if the sheet is hidden; otherwise, false.
     */
    isSheetHidden(): boolean {
        return Boolean(this._worksheet.isSheetHidden() === BooleanNumber.TRUE);
    }

    /**
     * Sets the sheet name.
     * @param {string} name The new name for the sheet.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // set the sheet name to 'Sheet1'
     * fWorkSheet.setName('Sheet1');
     * ```
     */
    setName(name: string): Promise<boolean> {
        return this._commandService.executeCommand(SetWorksheetNameCommand.id, {
            unitId: this._workbook.getUnitId(),
            subUnitId: this._worksheet.getSheetId(),
            name,
        });
    }

    /**
     * Activates this sheet. Does not alter the sheet itself, only the parent's notion of the active sheet.
     * @returns Current sheet, for chaining.
     */
    activate(): FWorksheet {
        this._fWorkbook.setActiveSheet(this);
        return this;
    }

    /**
     * Gets the position of the sheet in its parent spreadsheet. Starts at 0.
     * @returns {number} The position of the sheet in its parent spreadsheet.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // get the position of the active sheet
     * const position = fWorkSheet.getIndex();
     * console.log(position); // 0
     * ```
     */
    getIndex(): number {
        return this._workbook.getSheetIndex(this._worksheet);
    }

    /**
     * Clears the sheet of content and formatting information.Or Optionally clears only the contents or only the formatting.
     * @param {IFacadeClearOptions} [options] Options for clearing the sheet. If not provided, the contents and formatting are cleared both.
     * @param {boolean} [options.contentsOnly] If true, the contents of the sheet are cleared. If false, the contents and formatting are cleared. Default is false.
     * @param {boolean} [options.formatOnly] If true, the formatting of the sheet is cleared. If false, the contents and formatting are cleared. Default is false.
     * @returns  {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // clear the sheet of content and formatting information
     * fWorkSheet.clear();
     * // clear the sheet of content only
     * fWorkSheet.clear({ contentsOnly: true });
     * ```
     */
    clear(options?: IFacadeClearOptions): Promise<boolean> {
        if (options && options.contentsOnly && !options.formatOnly) {
            return this.clearContents();
        }

        if (options && options.formatOnly && !options.contentsOnly) {
            return this.clearFormats();
        }

        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const commandService = this._injector.get(ICommandService);

        const range = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
        };

        return commandService.executeCommand(ClearSelectionAllCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
            options,
        });
    }

    /**
     * Clears the sheet of contents, while preserving formatting information.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // clear the sheet of content only
     * fWorkSheet.clearContents();
     * ```
     */
    clearContents(): Promise<boolean> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const commandService = this._injector.get(ICommandService);

        const range = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
        };

        return commandService.executeCommand(ClearSelectionContentCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });
    }

    /**
     * Clears the sheet of formatting, while preserving contents.
     * @returns {Promise<boolean>} True if the command was successful, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // clear the sheet of formatting only
     * fWorkSheet.clearFormats();
     * ```
     */
    clearFormats(): Promise<boolean> {
        const unitId = this._workbook.getUnitId();
        const subUnitId = this._worksheet.getSheetId();
        const commandService = this._injector.get(ICommandService);

        const range = {
            startRow: 0,
            endRow: this._worksheet.getRowCount() - 1,
            startColumn: 0,
            endColumn: this._worksheet.getColumnCount() - 1,
        };

        return commandService.executeCommand(ClearSelectionFormatCommand.id, {
            unitId,
            subUnitId,
            ranges: [range],
        });
    }

    /**
     * Returns a Range corresponding to the dimensions in which data is present.
     * This is functionally equivalent to creating a Range bounded by A1 and (Sheet.getLastColumns(), Sheet.getLastRows()).
     * @returns {FRange} The range of the data in the sheet.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * // the sheet is a empty sheet
     * const cellRange = fWorkSheet.getRange(200, 10, 1, 1);
     * cellRange.setValue('Hello World');
     * console.log(fWorkSheet.getDataRange().getA1Notation()); // A1:J200
     * ```
     */
    getDataRange(): FRange {
        const lastRow = this.getLastRows();
        const lastColumn = this.getLastColumns();
        return this.getRange(0, 0, lastRow + 1, lastColumn + 1);
    }

    /**
     * Returns the position of the last column that has content.
     * @returns {number} the last column of the sheet that contains content.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * const fRange = fWorkSheet.getRange(100, 20, 1, 1);
     * console.log(fWorkSheet.getLastColumns()); // 20
     * ```
     */
    getLastColumns(): number {
        return this._worksheet.getLastColumnWithContent();
    }

    /**
     * Returns the position of the last column that has content. Same as getLastColumns.
     * @returns {number} the last column of the sheet that contains content.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * const fRange = fWorkSheet.getRange(100, 20, 1, 1);
     * console.log(fWorkSheet.getLastColumn());
     * ```
     */
    getLastColumn(): number {
        return this._worksheet.getLastColumnWithContent();
    }

    /**
     * Returns the position of the last row that has content.
     * @returns {number} the last row of the sheet that contains content.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * const fRange = fWorkSheet.getRange(100,1,1,1);
     * fRange.setValue('Hello World');
     * console.log(fWorkSheet.getLastRows()); // 100
     */
    getLastRows(): number {
        return this._worksheet.getLastRowWithContent();
    }

    /**
     * Returns the position of the last row that has content, same as getLastRows().
     * @returns {number} the last row of the sheet that contains content.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * const fRange = fWorkSheet.getRange(100,1,1,1);
     * fRange.setValue('Hello World');
     * console.log(fWorkSheet.getLastRow());
     */
    getLastRow(): number {
        return this._worksheet.getLastRowWithContent();
    }

    /**
     * Judge whether provided FWorksheet is equal to current.
     * @param {FWorksheet} other the FWorksheet to compare with.
     * @returns {boolean} true if the FWorksheet is equal to the current FWorksheet, false otherwise.
     * @example
     * ```ts
     * const fWorkbook = univerAPI.getActiveWorkbook();
     * const fWorkSheet = fWorkbook.getActiveSheet();
     * const fWorkSheet2 = fWorkbook.getSheetByName('Sheet1');
     * console.log(fWorkSheet.equals(fWorkSheet2)); // true, if the active sheet is 'Sheet1'
     * ```
     */
    equalTo(other: FWorksheet): boolean {
        if (other instanceof FWorksheet) {
            return this._worksheet.getSheetId() === other.getSheetId() && this._workbook.getUnitId() === other.getWorkbook().getUnitId();
        }
        return false;
    }

    /*
    * Insert a defined name for worksheet.
     * @param {string} name The name of the defined name to insert
     * @param {string} formulaOrRefString The formula(=sum(A2:b10)) or reference(A1) string of the defined name to insert
     * @example
     * ```ts
     * // The code below inserts a defined name
     * const activeSpreadsheet = univerAPI.getActiveWorkbook();
     * const sheet1 = activeSpreadsheet.getSheetByName('Sheet1');
     * sheet1.insertDefinedName('MyDefinedName', 'Sheet1!A1');
     * ```
     */
    insertDefinedName(name: string, formulaOrRefString: string): void {
        const definedNameBuilder = this._injector.createInstance(FDefinedNameBuilder);
        const param = definedNameBuilder.setName(name).setRef(formulaOrRefString).build();
        param.localSheetId = this.getSheetId();
        this._fWorkbook.insertDefinedNameBuilder(param);
    }

     /**
      * Get all the defined names in the worksheet.
      * @returns {FDefinedName[]} All the defined names in the worksheet
      * @example
      * ```ts
      * // The code below gets all the defined names in the worksheet
      * const activeSpreadsheet = univerAPI.getActiveWorkbook();
      * const sheet1 = activeSpreadsheet.getSheetByName('Sheet1');
      * const definedNames = sheet1.getDefinedNames();
      * ```
      */
    getDefinedNames(): FDefinedName[] {
        const names = this._fWorkbook.getDefinedNames();
        return names.filter((name) => name.getLocalSheetId() === this.getSheetId());
    }
}
