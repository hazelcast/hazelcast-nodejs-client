/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

import {IdentifiedDataSerializable} from './serialization/Serializable';
import {DataInput, DataOutput} from './serialization/Data';
import {ADDRESS_CLASS_ID, CLUSTER_DATA_FACTORY_ID} from './ClusterDataFactory';
import * as net from 'net';

class Address implements IdentifiedDataSerializable {

    host: string;
    port: number;
    type: number;

    constructor(host?: string, port?: number) {
        this.host = host;
        this.port = port;
        if (net.isIPv6(host)) {
            this.type = 6;
        } else {
            this.type = 4;
        }
    }

    readData(input: DataInput): any {
        this.port = input.readInt();
        this.type = input.readByte();
        this.host = input.readUTF();
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.port);
        output.writeByte(this.type);
        output.writeUTF(this.host);
    }

    getFactoryId(): number {
        return CLUSTER_DATA_FACTORY_ID;
    }

    getClassId(): number {
        return ADDRESS_CLASS_ID;
    }

    toString(): string {
        return this.host + ':' + this.port;
    }
}

export = Address;
