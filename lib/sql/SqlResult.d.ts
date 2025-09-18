import * as Long from 'long';
import { SqlRow } from './SqlRow';
import { SqlRowMetadata } from './SqlRowMetadata';
/**
 * An {@link SqlResult} iterates over this type if {@link SqlStatementOptions.returnRawResult} is set to `false`
 * (by default `false`) while {@link SqlService.execute | executing} an SQL query.
 *
 * Keys are column names and values are values in the SQL row.
 */
export declare type SqlRowAsObject = {
    [key: string]: any;
};
/**
 * Represents one of {@link SqlRow} and {@link SqlRowAsObject}.
 */
export declare type SqlRowType = SqlRow | SqlRowAsObject;
/**
 * SQL query result. Depending on the statement type it represents a stream of rows or an update count.
 *
 * ### Iteration
 *
 * An `SqlResult` is an async iterable of {@link SqlRowType} which is either an {@link SqlRow} or regular JavaScript objects.
 * By default it returns regular JavaScript objects, containing key and values. Keys represent column names, whereas
 * values represent row values. The default object returning behavior can be changed via the option
 * {@link SqlStatementOptions.returnRawResult}. If it is true, {@link SqlRow} objects are returned instead of regular objects.
 *
 * Values in SQL rows are deserialized lazily. While iterating you will get a {@link HazelcastSqlException} if a value in SQL row
 * cannot be deserialized.
 *
 * Use {@link close} to release the resources associated with the result.
 *
 * An `SqlResult` can be iterated only once.
 *
 * #### for-await... of
 *
 * Refer to [for-await... of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
 * page for more information.
 *
 * ```js
 * for await (const row of result) {
 *     console.log(row);
 * }
 * ```
 *
 * #### next()
 *
 * Another approach of iterating rows is using the {@link next} method. Every call to `next` returns an object with `done` and
 * `value` properties. `done` is `false` when there are more rows to iterate, `true` otherwise. `value` holds the current row
 * value. Refer to [iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) for more
 * information about iteration in JavaScript.
 *
 * ```js
 * let row = await result.next();
 * while (!row.done) {
 *     console.log(row.value);
 *     row = await result.next();
 * }
 * ```
 *
 * ### Usage for update count
 * ```js
 * const updateCount = result.updateCount; // A Long object
 * ```
 *
 * You don't need to call {@link close} in this case.
 *
 */
export interface SqlResult extends AsyncIterable<SqlRowType> {
    /**
     *  Returns next {@link SqlRowType} iteration result. You should not call this method when result does not contain
     *  rows.
     *  @throws {@link IllegalStateError} if result does not contain rows, but update count.
     *  @throws {@link HazelcastSqlException} if a value in current row cannot be deserialized.
     *  @returns an object including `value` and `done` keys. The `done` key indicates if
     *  iteration is ended, i.e when there are no more results. `value` holds iteration values which are in SqlRowType type.
     *  `value` has undefined value if iteration has ended.
     */
    next(): Promise<IteratorResult<SqlRowType>>;
    /**
     * Releases the resources associated with the query result.
     *
     * The query engine delivers the rows asynchronously. The query may become inactive even before all rows are
     * consumed. The invocation of this command will cancel the execution of the query on all members if the query
     * is still active. Otherwise it is no-op. For a result with an update count it is always no-op.
     */
    close(): Promise<void>;
    /**
     * SQL row metadata if rows exist in the result; otherwise null.
     */
    readonly rowMetadata: SqlRowMetadata | null;
    /**
     * Return whether this result has rows to iterate. False if update count is returned, true if rows are returned.
     * @returns whether this result is a row set
     */
    isRowSet(): boolean;
    /**
     * The number of rows updated by the statement or `-1` if this result is a row set.
     */
    readonly updateCount: Long;
}
