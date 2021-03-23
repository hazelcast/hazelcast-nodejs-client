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


export interface SqlRow {
    getObject<T>(columnIndex: number): T;

}

export interface SqlResult extends Iterable<SqlRow> {

}



export interface SqlService {

    execute(sql: string): SqlResult;
    /**
     * Convenient method to execute a distributed query with the given parameters.
     * Converts passed SQL string and parameters into an {@link SqlStatement} object and invokes {@link #execute(SqlStatement)}.
     *
     * @param sql SQL string
     * @param params query parameters that will be passed to {@link SqlStatement#setParameters(List)}
     * @returns {@link SqlResult}
     */
    execute(sql: string, ...params: any[]): SqlResult;
}

/** @internal */
export class SqlServiceImpl implements SqlService {
    public execute(sql: string, ...params: any[]): SqlResult {

    }
}
