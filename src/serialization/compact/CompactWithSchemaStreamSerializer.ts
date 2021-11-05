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
/** @ignore *//** */

import {SerializerAdapter} from '../SerializerAdapter';
import {ObjectDataInput, ObjectDataOutput} from '../ObjectData';
import {CompactStreamSerializer} from './CompactStreamSerializer';

/**
 * @internal
 */
export class CompactWithSchemaStreamSerializer implements SerializerAdapter {

    id = -56;

    constructor(private readonly serializer: CompactStreamSerializer) {
    }

    read(input: ObjectDataInput): any {
        return this.serializer.read(input, true);
    }

    write(output: ObjectDataOutput, object: any): void {
        this.serializer.write(output, object, true);
    }
}
