/**
 * The expected statement result type.
 */
export declare enum SqlExpectedResultType {
    /** The statement may produce either rows or an update count. */
    ANY = 0,
    /** The statement must produce rows. An exception is thrown if the statement produces an update count. */
    ROWS = 1,
    /** The statement must produce an update count. An exception is thrown if the statement produces rows. */
    UPDATE_COUNT = 2
}
export declare type SqlExpectedResultTypeStrings = keyof typeof SqlExpectedResultType;
/**
 * Options used to change behavior of an SQL query.
 */
export interface SqlStatementOptions {
    /**
     * The schema name. The engine will try to resolve the non-qualified object identifiers from the statement in the
     * given schema. If not found, the default search path will be used, which looks for objects in the predefined
     * schemas `partitioned` and `public`.
     *
     * * The schema name is case sensitive. For example, `foo` and `Foo` are different schemas.
     * * The default value is `null` meaning only the default search path is used.
     */
    schema?: string;
    /**
     * The execution timeout in milliseconds. If the timeout is reached for a running statement, it will be cancelled forcefully.
     * Zero value means no timeout. `-1` means that the timeout in server config will be used.
     * Other negative values are prohibited.
     * Defaults to `-1`.
     */
    timeoutMillis?: number;
    /**
     * The cursor buffer size (measured in the number of rows).
     *
     * When a statement is submitted for execution, a {@link SqlResult} is returned as a result. When rows are ready to be
     * consumed, they are put into an internal buffer of the cursor. This parameter defines the maximum number of rows in
     * that buffer. When the threshold is reached, the backpressure mechanism will slow down the execution, possibly to a
     * complete halt, to prevent out-of-memory.
     *
     * Only positive values are allowed.
     *
     * The default value is expected to work well for most workloads. A bigger buffer size may give you a slight performance
     * boost for queries with large result sets at the cost of increased memory consumption.
     *
     * Defaults to `4096`.
     */
    cursorBufferSize?: number;
    /**
     * Expected result type of SQL query. By default, set to `ANY`. Available values
     * are `ANY`, `ROWS`, and `UPDATE_COUNT`.
     */
    expectedResultType?: SqlExpectedResultTypeStrings;
    /**
     * If true, SQL result will iterate over {@link SqlRow}s. If false SQL result, will iterate over regular objects.
     * Defaults to `false`.
     */
    returnRawResult?: boolean;
}
/**
 * Represents an SQL statement. This can be used to prepare SQL statement before {@link SqlService.execute}.
 *
 * Properties are read once before the execution is started.
 * Changes to properties do not affect the behavior of already running statements.
 */
export interface SqlStatement {
    /**
     * SQL string. The SQL string cannot be empty. SQL string placeholder character is question mark(`?`). A RangeError
     * is thrown during execute if `sql` is not valid.
     */
    sql: string;
    /**
     * Parameters of the SQL. You may define parameter placeholders in the statement with the `?` character.
     * For every placeholder, a value must be provided. When the method is called, the contents of the list are copied.
     * Subsequent changes to the original list don't change the statement parameters.
     */
    params?: any[];
    /**
     * Options of the SQL statement.
     */
    options?: SqlStatementOptions;
}
