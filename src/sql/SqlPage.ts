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
        private readonly columnTypes: (keyof typeof SqlColumnType)[],
        private readonly dataHolder: DataHolder,
        private readonly last: boolean
    ) {
    }
    static fromColumns(columnTypes: (keyof typeof SqlColumnType)[], columns: any[][], last: boolean): SqlPage {
        return new SqlPage(columnTypes, new ColumnarDataHolder(columns), last);
    }
}

/** @internal */
class ColumnarDataHolder implements DataHolder {
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
