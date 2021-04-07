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

type SqlRowAsObject = { [key: string]: any };
export type SqlRowType = SqlRow | SqlRowAsObject;

export interface SqlResult extends AsyncIterable<SqlRowType> {
    /**
     *  Returns a boolean promise indicating whether or not there are
     *  more {@link SqlRowType}s to be iterated
     *  @returns {Promise<boolean>}
     */
    hasNext(): Promise<boolean>;

    /**
     *  Returns a promise for next {@link SqlRowType}. The promise resolves to undefined if there
     *  are no more rows to be iterated.
     *  @returns {Promise<SqlRowType> | undefined}
     */
    next(): Promise<SqlRowType | undefined>;
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
        const next = this.next.bind(this);
        return {
            next(): Promise<IteratorResult<SqlRowType, SqlRowType>> {
                const deferred = deferredPromise<IteratorResult<SqlRowType, SqlRowType>>();
                this.hasNext().then((hasNext: boolean) => {
                    if (hasNext) {
                        return next().then((value: SqlRowType | undefined) => {
                            deferred.resolve({
                                done: false,
                                value: value
                            })
                        });
                    } else {
                        return next().then((value: SqlRowType | undefined) => {
                            deferred.resolve({
                                done: true,
                                value: value
                            });
                        });
                    }
                }).catch((err: any) => {
                    deferred.reject(err);
                });
                return deferred.promise;
            }
        }
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

    /**
     * Resets iteration variables
     */
    // resetIteration() {
    //     this.rowMetadata = null;
    //     this.currentPage = null;
    //     this.currentPosition = 0;
    //     this.currentPosition = 0;
    //     this.last = false;
    // }

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

    fetch(): SqlPage {

        return undefined;
    }

    hasNext(): Promise<boolean> {
        const deferred = deferredPromise<boolean>();
        this.executeDeferred.promise.then(() => {
            while (this.currentPosition === this.currentRowCount) {
                // Reached end of the page. Try fetching the next one if possible.
                if (!this.last) {
                    const page = this.fetch();
                    this.onNextPage(page);
                } else {
                    // No more pages expected, so return false.
                    deferred.resolve(false);
                }
            }
            deferred.resolve(true);
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    next(): Promise<SqlRowType | undefined> {
        const deferred = deferredPromise();
        if (!
            this.hasNext()
        ) {
            deferred.resolve(undefined);
        }
        const row = this.getCurrentRow();
        this.currentPosition++;
        deferred.resolve(row);
        return deferred.promise;
    }
}
