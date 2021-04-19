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
import {SqlRow, SqlRowImpl} from './SqlRow';
import * as Long from 'long';
import {SqlRowMetadata} from './SqlRowMetadata';
import {SqlPage} from './SqlPage';
import {SqlServiceImpl} from './SqlService';
import {Connection} from '../network/Connection';
import {SqlQueryId} from './SqlQueryId';
import {DeferredPromise, deferredPromise} from '../util/Util';
import {HazelcastSqlException} from '../core';
import {SqlErrorCode} from './SqlErrorCode';

export type SqlRowAsObject = { [key: string]: any };
export type SqlRowType = SqlRow | SqlRowAsObject;

export interface SqlResult extends AsyncIterable<SqlRowType> {
    /**
     *  Returns next {@link SqlRowType} iteration result.
     *  @returns {IteratorResult<SqlRowType>} An object including "value" and "done" keys. The "done" key indicates if
     *  iteration is ended, i.e when there are no more results. "value" holds iteration values which are in SqlRowType type.
     *  "value" has undefined value if iteration has ended.
     */
    next(): Promise<IteratorResult<SqlRowType>>;

    /**
     * Closes the result.
     */
    close(): Promise<void>;

    /**
     * Returns row metadata of the result.
     * @returns {Promise<SqlRowMetadata | undefined>} a promise that returns SqlRowMetadata if rows exists in the result
     * otherwise undefined is returned.(In the case of a update count result.). If SqlResult receives an error, this promise is
     * rejected with the same error.
     */
    getRowMetadata(): Promise<SqlRowMetadata | undefined>;

    /**
     * Return whether this result has rows to iterate. False if update count is returned or a response is not received yet.
     * @returns {boolean}
     */
    isRowSet(): Promise<boolean>;

    /**
     * Returns the number of rows updated by the statement or -1 if this result is a row set.
     * @returns {number} Update count
     */
    getUpdateCount(): Promise<Long>;

}

/** @internal */
export class SqlResultImpl implements SqlResult {
    /** Update count received as a result of sql execution. See {@link SqlExpectedResultType} */
    private updateCount: Long;
    private currentPage: SqlPage | null;
    /* The number of rows in current page */
    private currentRowCount: number;
    /* Counter for current row position during iteration of a page */
    private currentPosition: number;
    /* Made true when last page is received */
    private last: boolean;

    /**
     * Deferred promise that resolves to true when page is received. If an error is occurred during execution,
     * this promise is rejected with the error. Used by {@link _hasNext}
     */
    private readonly executeDeferred: DeferredPromise<boolean>;

    /**
     * Deferred promise that resolves to a SqlPage when fetch is completed.
     */
    private fetchDeferred: DeferredPromise<SqlPage>;

    /**
     * If closing of the result is triggered
     */
    private closeDeferred: DeferredPromise<void>;

    /*
    Whether the result is closed or not. The result is closed if an update count or the last page is received.
    When true, there is no need to send the "cancel" request to the server.
    */
    private closed: boolean;
    private rowMetadata: SqlRowMetadata | null;


    constructor(
        private readonly service: SqlServiceImpl,
        private readonly connection: Connection,
        private readonly queryId: SqlQueryId,
        private readonly cursorBufferSize: number,
        /* If true SqlResult is an object iterable, otherwise SqlRow iterable */
        private readonly returnRawResult: boolean = false
    ) {
        this.closed = false;
        this.rowMetadata = null;
        this.executeDeferred = deferredPromise<boolean>();
        this.executeDeferred.promise.catch(() => {
        });
    }

    [Symbol.asyncIterator](): AsyncIterator<SqlRowType, SqlRowType, SqlRowType> {
        const nextFn: () => Promise<IteratorResult<SqlRowType, SqlRowType | undefined>> = this.next.bind(this);
        return {
            next: nextFn
        }
    }

    /**
     * @internal
     * Returns new result object. Useful for mocking. (Constructor mocking is hard/impossible)
     */
    static newResult(
        service: SqlServiceImpl,
        connection: Connection,
        queryId: SqlQueryId,
        cursorBufferSize: number,
        returnRawResult: boolean
    ) {
        return new SqlResultImpl(service, connection, queryId, cursorBufferSize, returnRawResult);
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

    getRowMetadata(): Promise<SqlRowMetadata | undefined> {
        return this.executeDeferred.promise.then(() => {
            if (this.rowMetadata !== null) {
                // rows returned
                return this.rowMetadata;
            } else {
                // update count is returned
                return undefined;
            }
        });
    }

    close(): Promise<void> {
        // Return close promise if a close is already started
        if (this.closeDeferred?.promise) {
            return this.closeDeferred.promise;
        }

        this.closeDeferred = deferredPromise<void>();

        const error = new HazelcastSqlException(null, SqlErrorCode.CANCELLED_BY_USER, 'Cancelled by user');
        this.onExecuteError(error);
        // Reject ongoing fetch if there is one
        if(this.fetchDeferred?.promise)
            this.fetchDeferred.reject(error);
        // Send the close request.
        this.service.close(this.connection, this.queryId).then(() => {
            this.closed = true;
            this.closeDeferred.resolve();
        }).catch(this.closeDeferred.reject);

        return this.closeDeferred.promise
    }

    /** @internal */
    onNextPage(page: SqlPage) {
        this.currentPage = page;
        this.currentRowCount = page.getRowCount();
        this.currentPosition = 0;

        if (page.isLast()) {
            this.last = true;
            this.closed = true;
        }
    }

    /** @internal */
    onExecuteError(error: Error): void {
        if (this.closed) return;
        this.updateCount = Long.fromInt(-1);
        this.rowMetadata = null;
        this.executeDeferred.reject(error);
    }

    /** @internal */
    getCurrentRow(): SqlRowType {
        if (this.returnRawResult) { // raw result, returns SqlRowImpl
            const values = [];
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                values.push(this.currentPage.getColumnValuesForClient(i, this.currentPosition));
            }
            return new SqlRowImpl(values, this.rowMetadata);
        } else { // return objects
            const result: SqlRowAsObject = {};
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                const columnMetadata = this.rowMetadata.getColumn(i);
                if (columnMetadata != null) {
                    result[columnMetadata.name] = this.currentPage.getColumnValuesForClient(i, this.currentPosition);
                }
            }
            return result;
        }
    }

    /** @internal */
    onExecuteResponse(rowMetadata: SqlRowMetadata | null, rowPage: SqlPage, updateCount: Long) {
        // Ignore the response if sql result is closed.
        if (this.closed) return;

        if (rowMetadata != null) { // Result that including rows
            this.rowMetadata = rowMetadata;
            this.onNextPage(rowPage);
            this.updateCount = Long.fromInt(-1);
        } else { // Result that including update count
            this.updateCount = updateCount;
            this.closed = true;
        }
        this.executeDeferred.resolve(true);
    }

    /** @internal */
    fetch(): Promise<SqlPage> {
        // If there is an ongoing fetch, return that promise
        if (this.fetchDeferred?.promise)
            return this.fetchDeferred.promise;

        // Do not start a new fetch if the result is closed
        if (this.closeDeferred?.promise) {
            return Promise.reject('Cannot fetch, the result is closed');
        }

        this.fetchDeferred = deferredPromise<SqlPage>();

        this.service.fetch(this.connection, this.queryId, this.cursorBufferSize).then(value => {
            this.fetchDeferred.resolve(value);
        }).catch(this.fetchDeferred.reject);

        return this.fetchDeferred.promise;
    }

    /** @internal */
    _hasNext(): Promise<boolean> {
        return this.executeDeferred.promise.then(() => {
            const checkHasNext = () => {
                if (this.currentPosition === this.currentRowCount) {
                    // Reached end of the page. Try fetching the next one if possible.
                    if (!this.last) {
                        this.fetch().then(page => {
                            this.onNextPage(page);
                            checkHasNext();
                        }).catch(err => {
                            throw err;
                        });
                    } else {
                        // No more pages expected, so return false.
                        return false;
                    }
                } else {
                    return true;
                }
            }
            return checkHasNext();
        });
    }

    next(): Promise<IteratorResult<SqlRowType, SqlRowType | undefined>> {
        return this._hasNext().then((hasNext: boolean) => {
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
        }).catch(() => {
            return {
                done: true,
                value: undefined
            };
        });
    }
}
