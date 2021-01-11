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
import {Data, DataInput, DataOutput} from '../../serialization/Data';
import {IdentifiedDataSerializable, IdentifiedDataSerializableFactory} from '../../serialization/Serializable';
import Address = require('../../Address');

export const RELIABLE_TOPIC_MESSAGE_FACTORY_ID = -18;
export const RELIABLE_TOPIC_CLASS_ID = 2;

export class ReliableTopicMessage implements IdentifiedDataSerializable {
    publishTime: Long;
    publisherAddress: Address;
    payload: Data;

    readData(input: DataInput): any {
        this.publishTime = input.readLong();
        this.publisherAddress = input.readObject();
        this.payload = input.readData();
    }

    writeData(output: DataOutput): void {
        output.writeLong(this.publishTime);
        output.writeObject(this.publisherAddress);
        output.writeData(this.payload);
    }

    getFactoryId(): number {
        return RELIABLE_TOPIC_MESSAGE_FACTORY_ID;
    }

    getClassId(): number {
        return RELIABLE_TOPIC_CLASS_ID;
    }
}

export class ReliableTopicMessageFactory implements IdentifiedDataSerializableFactory {
    create(type: number): IdentifiedDataSerializable {
        if (type === RELIABLE_TOPIC_CLASS_ID) {
            return new ReliableTopicMessage();
        }
        return null;
    }
}
