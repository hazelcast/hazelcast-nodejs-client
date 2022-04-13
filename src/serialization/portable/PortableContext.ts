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
/** @ignore *//** */

import {ClassDefinitionContext} from './ClassDefinitionContext';
import {DataInput} from '../Data';
import {ClassDefinition, FieldDefinition} from './ClassDefinition';
import {ClassDefinitionWriter} from './ClassDefinitionWriter';
import {BitsUtil} from '../../util/BitsUtil';
import {Portable, VersionedPortable, FieldType} from '../Portable';
import {ClassDefinitionBuilder} from './ClassDefinitionBuilder';

/** @internal */
export class PortableContext {

    private readonly version: number;
    private readonly classDefContext: { [factoryId: number]: ClassDefinitionContext };

    constructor(portableVersion: number) {
        this.version = portableVersion;
        this.classDefContext = {};
    }

    getVersion(): number {
        return this.version;
    }

    readClassDefinitionFromInput(input: DataInput, factoryId: number, classId: number, version: number): ClassDefinition {
        let register = true;
        const builder = new ClassDefinitionBuilder(factoryId, classId, version);
        input.readInt();

        const fieldCount = input.readInt();
        const offset = input.position();
        for (let i = 0; i < fieldCount; i++) {
            const pos = input.readInt(offset + i * BitsUtil.INT_SIZE_IN_BYTES);
            input.position(pos);

            const len = input.readShort();
            let chars = '';
            for (let j = 0; j < len; j++) {
                chars += String.fromCharCode(input.readUnsignedByte());
            }

            const type: FieldType = input.readByte();
            const name = chars;
            let fieldFactoryId = 0;
            let fieldClassId = 0;
            let fieldVersion = this.version;
            if (type === FieldType.PORTABLE) {
                // is null
                if (input.readBoolean()) {
                    register = false;
                }
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what if there's a null inner Portable field
                if (register) {
                    fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                }
            } else if (type === FieldType.PORTABLE_ARRAY) {
                const k = input.readInt();
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what if there's a null inner Portable field
                if (k > 0) {
                    const p = input.readInt();
                    input.position(p);
                    fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                } else {
                    register = false;
                }
            }
            builder.addField(new FieldDefinition(i, name, type, fieldVersion, fieldFactoryId, fieldClassId));
        }
        let classDefinition = builder.build();
        if (register) {
            classDefinition = this.registerClassDefinition(classDefinition);
        }
        return classDefinition;
    }

    lookupOrRegisterClassDefinition(portable: Portable): ClassDefinition {
        const portableVersion = this.getClassVersion(portable);
        let cd = this.lookupClassDefinition(portable.factoryId, portable.classId, portableVersion);
        if (cd == null) {
            const writer = new ClassDefinitionWriter(this,
                new ClassDefinitionBuilder(portable.factoryId, portable.classId, portableVersion));
            portable.writePortable(writer);
            cd = writer.registerAndGet();
        }
        return cd;
    }

    lookupClassDefinition(factoryId: number, classId: number, version: number): ClassDefinition {
        const factory = this.classDefContext[factoryId];
        if (factory == null) {
            return null;
        } else {
            return factory.lookup(classId, version);
        }
    }

    registerClassDefinition(classDefinition: ClassDefinition): ClassDefinition {
        const factoryId = classDefinition.getFactoryId();
        if (!this.classDefContext[factoryId]) {
            this.classDefContext[factoryId] = new ClassDefinitionContext(factoryId);
        }
        return this.classDefContext[factoryId].register(classDefinition);
    }

    getClassVersion(portable: VersionedPortable | Portable): number {
        if (typeof (portable as VersionedPortable).version === 'number') {
            if ((portable as VersionedPortable).version < 0) {
                throw new RangeError('Version cannot be negative!');
            }
            return (portable as VersionedPortable).version;
        } else {
            return this.version;
        }
    }

}
