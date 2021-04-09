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

type SqlRowAsObject = { [key: string]: any };
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

    // Promise for next fetch result
    private fetchResult: DeferredPromise<SqlPage>;
    // Promise for close result
    private closeResult: DeferredPromise<void>;

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
        /* If true SqlResult is a SqlRow iterable, otherwise traditional objects are used */
        private readonly rawResults: boolean
    ) {
        this.closed = false;
        this.rowMetadata = null;
        this.executeDeferred = deferredPromise<boolean>();
    }

    [Symbol.asyncIterator](): AsyncIterator<SqlRowType, SqlRowType, SqlRowType> {
        const nextFn: () => Promise<IteratorResult<SqlRowType, SqlRowType | undefined>> = this.next.bind(this);
        return {
            next: nextFn
        }
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
        // Do nothing if the result is already closed
        if (this.closeResult?.promise) {
            return this.closeResult.promise;
        }

        this.closeResult = deferredPromise<void>();

        const error = new HazelcastSqlException(null, SqlErrorCode.CANCELLED_BY_USER, 'Cancelled by user');
        this.onExecuteError(error);
        // Make sure that all subsequent fetches will fail.
        this.fetchResult.reject(error);
        // Send the close request.
        this.service.close(this.connection, this.queryId).then(() => {
            this.closed = true;
            this.closeResult.resolve();
        }).catch(this.closeResult.reject);

        return this.closeResult.promise
    }

    onNextPage(page: SqlPage) {
        this.currentPage = page;
        this.currentRowCount = page.getRowCount();
        this.currentPosition = 0;

        if (page.isLast()) {
            this.last = true;
            this.closed = true;
        }
    }

    onExecuteError(error: Error): void {
        if (this.closed) return;
        this.updateCount = Long.fromInt(-1);
        this.rowMetadata = null;
        this.executeDeferred.reject(error);
    }


    getCurrentRow(): SqlRowType {
        if (this.rawResults) {
            const values = [];
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                values.push(this.currentPage.getColumnValuesForClient(i, this.currentPosition));
            }
            return new SqlRowImpl(values, this.rowMetadata);
        } else {
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

    fetch(): Promise<SqlPage> {
        if (this.fetchResult?.promise) return this.fetchResult.promise;
        this.fetchResult = deferredPromise<SqlPage>();

        this.service.fetch(this.connection, this.queryId, this.cursorBufferSize).then(value => {
            this.fetchResult.resolve(value);
        }).catch(this.fetchResult.reject);

        return this.fetchResult.promise;
    }

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
        });
    }
}
