/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import * as net from 'net';
import {ClusterDataFactoryHelper} from './ClusterDataFactoryHelper';
import {DataInput, DataOutput} from './serialization/Data';
import {IdentifiedDataSerializable} from './serialization/Serializable';

export class Address implements IdentifiedDataSerializable {

    host: string;
    port: number;
    type: number;
    // memoization for toString()
    private addrStr: string;

    constructor(host?: string, port?: number) {
        this.host = host;
        this.port = port;
        this.type = net.isIP(host);
        this.addrStr = this.toStringInternal();
    }

    readData(input: DataInput): any {
        this.port = input.readInt();
        this.type = input.readByte();
        this.host = input.readUTF();
        this.addrStr = this.toStringInternal();
    }

    writeData(output: DataOutput): void {
        output.writeInt(this.port);
        output.writeByte(this.type);
        output.writeUTF(this.host);
    }

    getFactoryId(): number {
        return ClusterDataFactoryHelper.FACTORY_ID;
    }

    getClassId(): number {
        return ClusterDataFactoryHelper.ADDRESS_ID;
    }

    equals(other: Address): boolean {
        if (other === this) {
            return true;
        }
        if (other == null) {
            return false;
        }
        if (other.host === this.host &&
            other.port === this.port &&
            other.type === this.type) {
            return true;
        }
        return false;
    }

    toString(): string {
        return this.addrStr;
    }

    private toStringInternal(): string {
        return this.host + ':' + this.port;
    }
}
