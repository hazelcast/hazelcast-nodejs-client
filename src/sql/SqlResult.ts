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
}

/** @internal */
export class SqlFetchResult {
    constructor(private readonly page: SqlPage | null, private readonly error: Error | null) {
        this.page = page;
        this.error = error;
    }

    isPending(): boolean {
        return this.page === null && this.error === null;
    }
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
     * this promise is rejected with the error. Used by {@link hasNext}
     */
    private readonly executeDeferred: DeferredPromise<boolean>;

    private fetchResult: SqlFetchResult;

    /*
    Whether the result is closed or not. The result is closed if an update count or the last page is received.
    When true, there is no need to send the "cancel" request to the server.
    */
    private closed;
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

    getRowMetadata(): Promise<SqlRowMetadata> {
        const deferred = deferredPromise<SqlRowMetadata>();
        this.executeDeferred.promise.then(() => {
            if (this.rowMetadata !== null) {
                // rows returned
                deferred.resolve(this.rowMetadata);
            } else {
                // update count is returned
                deferred.resolve(undefined);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    }

    onFetchFinished(page: SqlPage | null, error: Error) {

    }

    close(): Promise<void> {
        const deferred = deferredPromise<void>();
        // Do nothing if the result is already closed
        if (this.closed) {
            deferred.resolve();
            return deferred.promise;
        }

        const error = new HazelcastSqlException(null, SqlErrorCode.CANCELLED_BY_USER, 'Cancelled by user');
        this.onExecuteError(error);
        this.fetchResult = new SqlFetchResult(null, null);
        this.onFetchFinished(null, error);

        this.service.close(this.connection, this.queryId).then(() => {
            deferred.resolve();
        }).catch(deferred.reject);

        return deferred.promise;
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

        return undefined;
    }

    _hasNext(): Promise<boolean> {
        const deferred = deferredPromise<boolean>();
        this.executeDeferred.promise.then(() => {
            const checkHasNext = () => {
                if (this.currentPosition === this.currentRowCount) {
                    // Reached end of the page. Try fetching the next one if possible.
                    if (!this.last) {
                        this.fetch().then(page => {
                            this.onNextPage(page);
                            checkHasNext();
                        }).catch(deferred.reject);
                    } else {
                        // No more pages expected, so return false.
                        deferred.resolve(false);
                    }
                } else {
                    deferred.resolve(true);
                }
            }
            checkHasNext();
        }).catch(deferred.reject);
        return deferred.promise;
    }

    next(): Promise<IteratorResult<SqlRowType, SqlRowType | undefined>> {
        const deferred = deferredPromise<IteratorResult<SqlRowType, SqlRowType | undefined>>();
        this._hasNext().then((hasNext: boolean) => {
            if (hasNext) {
                const row = this.getCurrentRow();
                this.currentPosition++;
                deferred.resolve({
                    done: false,
                    value: row
                })
            } else {
                deferred.resolve({
                    done: true,
                    value: undefined
                });
            }
        }).catch((err: any) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
}
