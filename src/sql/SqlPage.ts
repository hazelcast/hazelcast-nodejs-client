import {SqlColumnType} from './SqlColumnMetadata';

/** @internal */
export class SqlPage {
    constructor(
        private readonly columnTypes: SqlColumnType[],
        private readonly data: any[][] | null, // first index is row index, second one is column index
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

    getValue(rowIndex: number, columnIndex: number): any {
        return this.data[rowIndex][columnIndex];
    }

    static newPage(columnTypes: SqlColumnType[], data: any[][], last: boolean): SqlPage {
        return new SqlPage(columnTypes, data, last);
    }
}
