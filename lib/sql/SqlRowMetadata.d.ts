import { SqlColumnMetadata } from './SqlColumnMetadata';
export interface SqlRowMetadata {
    /**
     * Gets the number of columns in the row.
     * @returns column count
     */
    getColumnCount(): number;
    /**
     *  Gets column metadata of column with given index.
     *  @returns SqlColumnMetadata of column with this index, undefined if column is not found.
     */
    getColumn(index: number): SqlColumnMetadata | undefined;
    /**
     *  Get column metadata objects.
     *  @returns this row's SqlColumnMetadata objects.
     */
    getColumns(): SqlColumnMetadata[];
    /**
     * Find index of the column with the given name. Returned index can be used to get column value from SqlRow.
     * @returns Column index. If a column is not found, `-1` is returned.
     * @throws {@link IllegalArgumentError} is thrown if columnName is not string.
     */
    findColumn(columnName: string): number;
}
