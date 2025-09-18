"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlResultImpl = void 0;
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const Long = require("long");
const SqlRow_1 = require("./SqlRow");
const Util_1 = require("../util/Util");
const core_1 = require("../core");
const SqlErrorCode_1 = require("./SqlErrorCode");
/** @internal */
class SqlResultImpl {
    constructor(sqlService, deserializeFn, connection, queryId, 
    /** The page size used for pagination */
    cursorBufferSize, 
    /** If true, SqlResult is an object iterable, otherwise SqlRow iterable */
    returnRawResult, clientUUID) {
        this.sqlService = sqlService;
        this.deserializeFn = deserializeFn;
        this.connection = connection;
        this.queryId = queryId;
        this.cursorBufferSize = cursorBufferSize;
        this.returnRawResult = returnRawResult;
        this.clientUUID = clientUUID;
        this.closed = false;
        this.last = false;
        this.rowMetadata = null;
        this.currentPage = null;
    }
    /** This symbol is needed to be included to be an async iterable */
    [Symbol.asyncIterator]() {
        const nextFn = this.next.bind(this);
        return {
            next: nextFn
        };
    }
    /**
     * Useful for mocking. (Constructor mocking is hard/impossible)
     * @returns new result object.
     */
    static newResult(sqlService, deserializeFn, connection, queryId, cursorBufferSize, returnRawResult, clientUUID) {
        return new SqlResultImpl(sqlService, deserializeFn, connection, queryId, cursorBufferSize, returnRawResult, clientUUID);
    }
    isRowSet() {
        return this.rowMetadata !== null;
    }
    close() {
        // Return the close promise if a close request is already started
        if (this.closeDeferred) {
            return this.closeDeferred.promise;
        }
        // If already closed, return a resolved promise
        if (this.closed) {
            return Promise.resolve();
        }
        this.closeDeferred = (0, Util_1.deferredPromise)();
        const error = new core_1.HazelcastSqlException(this.clientUUID, SqlErrorCode_1.SqlErrorCode.CANCELLED_BY_USER, 'Query was cancelled by user');
        // Prevent ongoing/future fetch requests
        if (!this.fetchDeferred) {
            this.fetchDeferred = (0, Util_1.deferredPromise)();
            this.fetchDeferred.promise.catch(() => { });
        }
        this.fetchDeferred.reject(error);
        // Send the close request.
        this.sqlService.close(this.connection, this.queryId).then(() => {
            this.closeDeferred.resolve();
        }).catch(err => {
            this.closeDeferred.reject(this.sqlService.rethrow(err, this.connection));
        });
        this.closed = true;
        return this.closeDeferred.promise;
    }
    /**
     * Called when next page of the result is received.
     * @param page
     */
    onNextPage(page) {
        this.currentPage = page;
        this.currentRowCount = page.getRowCount();
        this.currentPosition = 0;
        if (page.last) {
            this.last = true;
            this.closed = true;
        }
    }
    /**
     * Called when an error is occurred during SQL execution.
     * @param error The wrapped error that can be propagated to the user through executeDeferred.
     */
    onExecuteError(error) {
        this.updateCount = Long.fromInt(-1);
        this.rowMetadata = null;
    }
    /**
     * Used by {@link next}.
     * @returns the current row.
     */
    getCurrentRow() {
        if (this.returnRawResult) { // Return SqlRow
            const columnCount = this.currentPage.getColumnCount();
            const values = new Array(columnCount);
            for (let i = 0; i < columnCount; i++) {
                values[i] = this.currentPage.getValue(this.currentPosition, i);
            }
            // Deserialization happens lazily while getting the object.
            return new SqlRow_1.SqlRowImpl(values, this.rowMetadata, this.deserializeFn);
        }
        else { // Return objects
            const result = {};
            for (let i = 0; i < this.currentPage.getColumnCount(); i++) {
                const columnMetadata = this.rowMetadata.getColumn(i);
                result[columnMetadata.name] = this.deserializeFn(this.currentPage.getValue(this.currentPosition, i), false);
            }
            return result;
        }
    }
    /**
     * Called when a execute response is received.
     * @param rowMetadata  The row metadata. It is null if the response only contains the update count.
     * @param rowPage The first page of the result. It is null if the response only contains the update count.
     * @param updateCount The update count.
     */
    onExecuteResponse(rowMetadata, rowPage, updateCount) {
        if (rowMetadata !== null) { // Result that includes rows
            this.rowMetadata = rowMetadata;
            this.onNextPage(rowPage);
            this.updateCount = Long.fromInt(-1);
        }
        else { // Result that includes update count
            this.updateCount = updateCount;
            this.closed = true;
        }
    }
    /**
     * Fetches the next page. Called internally by iteration logic. Pages are fetched whenever the current page is fully
     * iterated.
     */
    fetch() {
        // If there is an ongoing fetch, return that promise
        if (this.fetchDeferred) {
            return this.fetchDeferred.promise;
        }
        // Do not start a fetch if the result is already closed
        if (this.closed) {
            return Promise.reject(new core_1.IllegalStateError('Cannot fetch, the result is already closed'));
        }
        this.fetchDeferred = (0, Util_1.deferredPromise)();
        this.sqlService.fetch(this.connection, this.queryId, this.cursorBufferSize).then(sqlPage => {
            this.fetchDeferred.resolve(sqlPage);
            this.fetchDeferred = undefined; // Set fetchDeferred to undefined to be able to fetch again
        }).catch(err => {
            this.fetchDeferred.reject(this.sqlService.rethrow(err, this.connection));
        });
        return this.fetchDeferred.promise;
    }
    /**
     * Checks if there are rows to iterate in a recursive manner, similar to a non-blocking while block
     */
    checkHasNext() {
        if (this.currentPosition === this.currentRowCount) {
            // Reached end of the page. Try fetching the next page if there are more.
            if (!this.last) {
                return this.fetch().then(page => {
                    this.onNextPage(page);
                    return this.checkHasNext();
                });
            }
            else {
                // No more pages are expected, so resolve false.
                return Promise.resolve(false);
            }
        }
        else {
            return Promise.resolve(true);
        }
    }
    /**
     * Used by {@link next}.
     * @returns if there are rows to be iterated.
     */
    hasNext() {
        if (this.rowMetadata === null) {
            return Promise.reject(new core_1.IllegalStateError('This result contains only update count'));
        }
        return this.checkHasNext();
    }
    next() {
        return this.hasNext().then(hasNext => {
            if (hasNext) {
                const row = this.getCurrentRow();
                this.currentPosition++;
                return {
                    done: false,
                    value: row
                };
            }
            else {
                return {
                    done: true,
                    value: undefined
                };
            }
        });
    }
}
exports.SqlResultImpl = SqlResultImpl;
//# sourceMappingURL=SqlResult.js.map