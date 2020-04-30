/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from '../serialization/Serializable';
import {DataInput, DataOutput} from '../serialization/Data';

export const REST_VALUE_FACTORY_ID = -37;
export const REST_VALUE_CLASS_ID = 1;

export class RestValue implements IdentifiedDataSerializable {
    value: number[];
    contentType: number[];

    getClassId(): number {
        return REST_VALUE_CLASS_ID;
    }

    getFactoryId(): number {
        return REST_VALUE_FACTORY_ID;
    }

    readData(input: DataInput): any {
        this.value = input.readByteArray();
        this.contentType = input.readByteArray();
    }

    writeData(output: DataOutput): void {
        output.writeByteArray(this.value);
        output.writeByteArray(this.contentType);
    }
}

export class RestValueFactory implements IdentifiedDataSerializableFactory {
    create(type: number): IdentifiedDataSerializable {
        if (type === REST_VALUE_CLASS_ID) {
            return new RestValue();
        }
        return null;
    }
}
