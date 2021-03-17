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

import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {DataInput, DataOutput} from '../serialization/Data';

/** @internal */
export const REST_VALUE_FACTORY_ID = -25;
/** @internal */
export const REST_VALUE_CLASS_ID = 1;

/**
 * Wrapper for values stored via IMDG REST API.
 */
export class RestValue implements IdentifiedDataSerializable {

    /**
     * Wrapped value.
     */
    value: string;
    /**
     * HTTP Content-Type specified for the value.
     */
    contentType: string;
    /** @ignore */
    factoryId = REST_VALUE_FACTORY_ID;
    /** @ignore */
    classId = REST_VALUE_CLASS_ID;

    /** @ignore */
    readData(input: DataInput): any {
        this.value = input.readString();
        this.contentType = input.readString();
    }

    /** @ignore */
    writeData(output: DataOutput): void {
        output.writeString(this.value);
        output.writeString(this.contentType);
    }
}

/** @internal */
export function restValueFactory(classId: number): IdentifiedDataSerializable {
    if (classId === REST_VALUE_CLASS_ID) {
        return new RestValue();
    }
    return null;
}
