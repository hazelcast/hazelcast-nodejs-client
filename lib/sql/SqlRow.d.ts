import { SqlRowMetadata } from './SqlRowMetadata';
/**
 * A row in an {@link SqlResult}.
 *
 * If you set {@link SqlStatementOptions.returnRawResult} to `true`, `SqlRow` objects will be returned.
 * Otherwise, you will get regular JavaScript objects where keys are column names and values are values in the SQL row.
 *
 * Values in an `SqlRow` deserialized lazily. If there is an {@link SqlColumnType.OBJECT} field in the result that can't be
 * deserialized, it is advised to set the option {@link SqlStatementOptions.returnRawResult} to `false` while running the query.
 * Otherwise, since you will get a regular JSON object, values will be tried to be deserialized; and you may get a serialization
 * error.
 */
export interface SqlRow {
    /**
     * Gets the value of the column by column index or column name.
     * The class of the returned value depends on the SQL type of the column. See {@link SqlColumnType}
     *
     * **Warning:** Each call to this method might result in deserialization if the column type for this object is
     * {@link SqlColumnType.OBJECT}. It is advised to assign the result of this method call to some variable and reuse it to
     * avoid deserializing twice.
     *
     * @param columnNameOrIndex Column name or index
     * @returns value in specified column of this row, or undefined if there is no value at the provided index.
     * @throws {@link IllegalArgumentError} if columnNameOrIndex is string and column specified with name does not exist
     * @throws {@link IllegalArgumentError} if columnNameOrIndex is not string or number
     * @throws {@link HazelcastSqlException} If the object cannot be deserialized.
     */
    getObject<T>(columnNameOrIndex: string | number): T;
    /**
     * Get row metadata of this row.
     * @returns row metadata
     */
    getMetadata(): SqlRowMetadata;
}
