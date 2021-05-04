/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as Long from 'long';

import {SqlRow, SqlRowImpl} from './SqlRow';
import {SqlRowMetadata} from './SqlRowMetadata';
import {SqlPage} from './SqlPage';
import {SqlServiceImpl} from './SqlService';
import {Connection} from '../network/Connection';
import {SqlQueryId} from './SqlQueryId';
import {DeferredPromise, deferredPromise} from '../util/Util';
import {HazelcastSqlException, UUID} from '../core';
import {SqlErrorCode} from './SqlErrorCode';
import {SerializationService} from '../serialization/SerializationService';

export type SqlRowAsObject = { [key: string]: any };
export type SqlRowType = SqlRow | SqlRowAsObject;

/**
 * ## SQL Result
 *
 * Represents an SQL result. {@link SqlService.execute} returns an SqlResult.
 *
 * ### Iteration
 *
 * The SqlResult is an async iterable of {@link SqlRowType} which is either an {@link SqlRow} or regular objects.
 * By default it returns regular javascript objects, containing key and values. Keys represent column names, whereas
 * values represent row values. The default object returning behavior can be changed via the option
 * {@link SqlStatementOptions.returnRawResult}. If it is true, {@link SqlRow} objects are returned instead of regular objects.
 *
 * #### for-await... of
 *
 * Refer to [for-await... of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
 * page for more information.
 *
 * ```js
 * for await(const row of result){
 *     console.log(row);
 * }
 * ```
 *
 * #### next()
 *
 * Another approach to iterating rows is using {@link next}. Next returns an object with `done` and `value` properties.
 * `done` is false when there are more rows to iterate, false otherwise. `value` holds the current row value. Refer to
 * [iterators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) for more information.
 *
 * ```js
 * let row = await result.next();
 * while (!row.done) {
 *     console.log(row.value);
 *     row = await result.next();
 * }
 * ```
 *
 */
export interface SqlResult extends AsyncIterable<SqlRowType> {
    /**
     *  Returns next {@link SqlRowType} iteration result.
     *  @returns {IteratorResult<SqlRowType>} An object including "value" and "done" keys. The "done" key indicates if
     *  iteration is ended, i.e when there are no more results. "value" holds iteration values which are in SqlRowType type.
     *  "value" has undefined value if iteration has ended.
     */
    next(): Promise<IteratorResult<SqlRowType>>;

    /**
     * Closes the result. This will prevent further iterations.
     */
    close(): Promise<void>;

    /**
     * Returns row metadata of the result.
     * @returns SqlRowMetadata if rows exists in the result, otherwise, e.g update count result is received, to null.
     * If SQL execution was not successful, this promise is rejected with an error.
     */
    getRowMetadata(): Promise<SqlRowMetadata | null>;

    /**
     * Return whether this result has rows to iterate. False if update count is returned or a response is not received yet.
     * If SQL execution was not successful, this promise is rejected with an error.
     */
    isRowSet(): Promise<boolean>;

    /**
     * Returns the number of rows updated by the statement or -1 if this result is a row set.
     * If SQL execution was not successful, this promise is rejected with an error.
     * @returns Update count
     */
    getUpdateCount(): Promise<Long>;

}

/** @internal */
export class SqlResultImpl implements SqlResult {
    /** Update count received as a result of SQL execution. See {@link SqlExpectedResultType} */
    private updateCount: Long;
    private currentPage: SqlPage | null;
    /* The number of rows in current page */
    private currentRowCount: number;
    /* Current row position in current page */
    private currentPosition: number;
    /* Set to true when the last page is received */
    private last: boolean;

    /**
     * Deferred promise that resolves to true when an execute response is received. If an error is occurred during execution,
     * this promise is rejected with the error.
     */
    private readonly executeDeferred: DeferredPromise<boolean>;

    /**
     * Deferred promise that resolves to an SqlPage when current fetch request is completed.
     */
    private fetchDeferred: DeferredPromise<SqlPage>;

    /**
     * Deferred promise that resolves when current close request is completed.
     */
    private closeDeferred: DeferredPromise<void>;

    /**
     * Whether the result is closed or not. The result is closed if an update count or the last page is received.
     * When true, there is no need to send the "cancel" request to the server.
     */
    private closed: boolean;

    /**
     * Row metadata of the result. Initially null.
     */
    private rowMetadata: SqlRowMetadata | null;

    constructor(
        private readonly sqlService: SqlServiceImpl,
        private readonly serializationService: SerializationService,
        private readonly connection: Connection,
        private readonly queryId: SqlQueryId,
        /** The page size used for pagination */
        private readonly cursorBufferSize: number,
        /** If true, SqlResult is an object iterable, otherwise SqlRow iterable */
        private readonly returnRawResult: boolean,
        private readonly clientUUID: UUID
    ) {
        this.closed = false;
        this.last = false;
        this.rowMetadata = null;
        this.currentPage = null;
        this.executeDeferred = deferredPromise<boolean>();
        this.executeDeferred.promise.catch(() => {
        });
    }

    /** This symbol is needed to be included to be an async iterable */
    [Symbol.asyncIterator](): AsyncIterator<SqlRowType, SqlRowType, SqlRowType> {
        const nextFn = this.next.bind(this);
        return {
            next: nextFn
        }
    }

    /**
     * Returns new result object. Useful for mocking. (Constructor mocking is hard/impossible)
     */
    static newResult(
        sqlService: SqlServiceImpl,
        serializationService: SerializationService,
        connection: Connection,
        queryId: SqlQueryId,
        cursorBufferSize: number,
        returnRawResult: boolean,
        clientUUID: UUID
    ) {
        return new SqlResultImpl(sqlService, serializationService, connection, queryId, cursorBufferSize,
            returnRawResult, clientUUID);
    }

    getUpdateCount(): Promise<Long> {
        return this.executeDeferred.promise.then(() => {
            return this.updateCount;
        });
    }

    isRowSet(): Promise<boolean> {
        return this.executeDeferred.promise.then(() => {
            return this.updateCount === Long.fromInt(-1);
        });
    }

    getRowMetadata(): Promise<SqlRowMetadata | null> {
        return this.executeDeferred.promise.then(() => {
            return this.rowMetadata;
        });
    }

    close(): Promise<void> {
        // Return the close promise if a close request is already started
        if (this.closeDeferred?.promise) {
            return this.closeDeferred.promise;
        }

        this.closeDeferred = deferredPromise<void>();

        const error = new HazelcastSqlException(this.clientUUID, SqlErrorCode.CANCELLED_BY_USER, 'Cancelled by user');
        // Reject execute with user cancellation error.
        this.onExecuteError(error);
        // Reject ongoing fetch request if there is one.
        if (this.fetchDeferred?.promise)
            this.fetchDeferred.reject(error);
        // Send the close request.
        this.sqlService.close(this.connection, this.queryId).then(() => {
            this.closed = true;
            this.closeDeferred.resolve();
        }).catch(this.closeDeferred.reject);

        return this.closeDeferred.promise
    }

    /** Called when next page of the result is received. */
    onNextPage(page: SqlPage) {
        this.currentPage = page;
        this.currentRowCount = page.getRowCount();
        this.currentPosition = 0;

        if (page.isLast()) {
            this.last = true;
            this.closed = true;
        }
    }

    /** Called when an error is occurred during SQL execute */
    onExecuteError(error: HazelcastSqlException): void {
        if (this.closed) return;
        this.updateCount = Long.fromInt(-1);
        this.rowMetadata = null;
        this.executeDeferred.reject(error);
    }

    /** Returns the current row. Used by {@link next}. */
    getCurrentRow(): SqlRowType {
        if (this.returnRawResult) { // Return SqlRow
            const values = [];
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                values.push({
                    name: this.rowMetadata.getColumns()[i].name,
                    value: this.serializationService.toObject(this.currentPage.getValue(this.currentPosition, i))
                });
            }
            return new SqlRowImpl(values, this.rowMetadata);
        } else { // Return objects
            const result: SqlRowAsObject = {};
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                const columnMetadata = this.rowMetadata.getColumnByIndex(i);
                if (columnMetadata != null) {
                    result[columnMetadata.name] = this.serializationService.toObject(
                        this.currentPage.getValue(this.currentPosition, i)
                    );
                }
            }
            return result;
        }
    }

    /** Called when a execute response is received. */
    onExecuteResponse(rowMetadata: SqlRowMetadata | null, rowPage: SqlPage, updateCount: Long) {
        // Ignore the response if SQL result is closed.
        if (this.closed) return;

        if (rowMetadata !== null) { // Result that including rows
            this.rowMetadata = rowMetadata;
            this.onNextPage(rowPage);
            this.updateCount = Long.fromInt(-1);
        } else { // Result that including update count
            this.updateCount = updateCount;
            this.closed = true;
        }
        this.executeDeferred.resolve(true);
    }

    /**
     * Fetches the next page. Called internally by iteration logic. Pages are fetched whenever the current page is fully
     * iterated.
     */
    fetch(): Promise<SqlPage> {
        // If there is an ongoing fetch, return that promise
        if (this.fetchDeferred?.promise)
            return this.fetchDeferred.promise;

        // Do not start a fetch if close is called
        if (this.closeDeferred?.promise) {
            return Promise.reject('Cannot fetch, close() is called');
        }
        // Do not start a fetch if the result is already closed
        if (this.closed) {
            return Promise.reject('Cannot fetch, the result is already closed');
        }

        this.fetchDeferred = deferredPromise<SqlPage>();

        this.sqlService.fetch(this.connection, this.queryId, this.cursorBufferSize).then(value => {
            this.fetchDeferred.resolve(value);
            this.fetchDeferred = undefined; // Set fetchDeferred to undefined to be able to fetch again
        }).catch(this.fetchDeferred.reject);

        return this.fetchDeferred.promise;
    }

    /** Returns if there are rows to be iterated. Used by {@link next}. */
    hasNext(): Promise<boolean> {
        return this.executeDeferred.promise.then(() => {
            // While loop similar logic is written via recursion when written in async manner
            const checkHasNext = (): Promise<boolean> => {
                if (this.currentPosition === this.currentRowCount) {
                    // Reached end of the page. Try fetching the next page if there are more.
                    if (!this.last) {
                        return this.fetch().then(page => {
                            this.onNextPage(page);
                            return checkHasNext();
                        });
                    } else {
                        // No more pages are expected, so resolve false.
                        return Promise.resolve(false);
                    }
                } else {
                    return Promise.resolve(true);
                }
            }
            return checkHasNext();
        });
    }

    next(): Promise<IteratorResult<SqlRowType, SqlRowType | undefined>> {
        return this.hasNext().then((hasNext: boolean) => {
            if (hasNext) {
                const row = this.getCurrentRow();
                this.currentPosition++;
                return {
                    done: false,
                    value: row
                };
            } else {
                return {
                    done: true,
                    value: undefined
                };
            }
        });
    }
}
