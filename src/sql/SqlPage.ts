import {SqlColumnType} from './SqlColumnMetadata';

/** @internal */
export class SqlPage {
    constructor(
        private readonly columnTypes: SqlColumnType[],
        private readonly data: any[][], // first index is row index, second one is column index
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
        return this.data.length;
    }

    getColumnCount(): number {
        return this.columnTypes.length;
    }

    getValue(columnIndex: number, rowIndex: number): any {
        return this.data[rowIndex][columnIndex]
    }

    static fromColumns(columnTypes: SqlColumnType[], columns: any[][], last: boolean): SqlPage {
        return new SqlPage(columnTypes, columns, last);
    }
}
