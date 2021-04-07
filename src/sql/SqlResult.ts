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
    private error: Error | null = null;
    private currentPage: SqlPage | null;
    /* The number of rows in current page */
    private currentRowCount: number;
    /* Counter for current row position during iteration of a page */
    private currentPosition: number;
    /* Made true when last page is received */
    private last: boolean;
    /* If true SqlResult is a SqlRow iterable, otherwise traditional objects are used */
    private rawResults = false;


    /*
    Whether the result is closed or not. The result is closed if an update count or the last page is received.
    When true, there is no need to send the "cancel" request to the server.
    */
    private closed: boolean;
    private rowMetadata: SqlRowMetadata | null = null;


    constructor(
        private readonly service: SqlServiceImpl,
        private readonly connection: Connection,
        private readonly queryId: SqlQueryId,
        private readonly cursorBufferSize: number
    ) {
    }

    [Symbol.asyncIterator](): AsyncIterator<SqlRowType, SqlRowType, SqlRowType> {
        const hasNext: () => Promise<boolean> = this.hasNext.bind(this);
        const next: () => Promise<SqlRowType | undefined> = this.next.bind(this);
        return {
            next(): Promise<IteratorResult<SqlRowType, SqlRowType>> {
                return new Promise<IteratorResult<SqlRowType, SqlRowType>>(
                    (resolve, reject) => {
                        hasNext().then((hasNext) => {
                            if (hasNext) {
                                return next().then((value: SqlRowType | undefined) => {
                                    resolve({
                                        done: true,
                                        value: value
                                    })
                                });
                            } else {
                                resolve({
                                    done: false,
                                    value: this.next()
                                });
                            }
                        }).catch((err: any) => {
                            reject(err);
                        });
                    }
                );
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
        this.error = error;
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
    }

    hasNext(): Promise<boolean> {
        return new Promise((resolve, reject) => true);
    }

    next(): Promise<SqlRowType | undefined> {
        return new Promise((resolve, reject) => null);
    }
}
