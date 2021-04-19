import {SqlColumnType} from './SqlColumnMetadata';
import assert = require('assert');

/** @internal */
interface DataHolder {
    getRowCount(): number;

    getColumnValueForClient(columnIndex: number, rowIndex: number): any;

    getColumnValuesForServer(columnIndex: number, columnType: SqlColumnType): any[];
}

/** @internal */
export class SqlPage {
    constructor(
        private readonly columnTypes: SqlColumnType[],
        private readonly dataHolder: DataHolder,
        private readonly last: boolean
    ) {
    }

    isLast(): boolean {
        return this.last;
    }

    getColumnTypes(): SqlColumnType[] {
        return this.columnTypes;
    }

    getRowCount(): number {
        return this.dataHolder.getRowCount();
    }

    getColumnCount(): number {
        return this.columnTypes.length;
    }

    getColumnValuesForServer(columnIndex: number): any[] {
        assert.strictEqual(columnIndex < this.getColumnCount(), true);
        const columnType = this.columnTypes[columnIndex];

        return this.dataHolder.getColumnValuesForServer(columnIndex, columnType);
    }

    getColumnValuesForClient(columnIndex: number, rowIndex: number): any {
        assert.strictEqual(columnIndex < this.getColumnCount(), true);
        assert.strictEqual(rowIndex < this.getRowCount(), true);
        return this.dataHolder.getColumnValueForClient(columnIndex, rowIndex);
    }

    static fromColumns(columnTypes: SqlColumnType[], columns: any[][], last: boolean): SqlPage {
        return new SqlPage(columnTypes, new ColumnarDataHolder(columns), last);
    }
}

/** @internal */
export class ColumnarDataHolder implements DataHolder {
    constructor(private readonly columns: any[][]) {

    }

    getColumnValueForClient(columnIndex: number, rowIndex: number): any {
        return this.columns[columnIndex][rowIndex];
    }

    getColumnValuesForServer(columnIndex: number, columnType: SqlColumnType): any[] {
        assert.notStrictEqual(columnType, SqlColumnType.OBJECT);
        return this.columns[columnIndex];
    }

    getRowCount(): number {
        return this.columns[0].length;
    }
}
