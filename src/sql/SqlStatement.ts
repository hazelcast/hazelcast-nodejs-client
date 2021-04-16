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

export enum SqlExpectedResultType {
    ANY,
    ROWS,
    UPDATE_COUNT
}

export type SqlExpectedResultTypeStrings = keyof typeof SqlExpectedResultType;

export interface SqlStatementOptions {
    schema?: string;
    timeoutMillis?: Long;
    cursorBufferSize?: number;
    expectedResultType?: SqlExpectedResultTypeStrings;
    returnRawResult?: boolean;
}

export interface SqlStatement {
    sql: string;
    params?: any[];
    options?: SqlStatementOptions;
}
