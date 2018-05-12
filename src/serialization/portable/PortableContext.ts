/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {SerializationService} from '../SerializationService';
import {ClassDefinitionContext} from './ClassDefinitionContext';
import {DataInput} from '../Data';
import {ClassDefinition, FieldType} from './ClassDefinition';
import {ClassDefinitionWriter} from './ClassDefinitionWriter';
import {BitsUtil} from '../../BitsUtil';
import {Portable, VersionedPortable} from '../Serializable';

export class PortableContext {
    private service: SerializationService;
    private portableVersion: number = 0;
    private classDefContext: { [factoyId: number]: ClassDefinitionContext };

    constructor(service: SerializationService, portableVersion: number) {
        this.service = service;
        this.portableVersion = portableVersion;
        this.classDefContext = {};
    }

    getVersion(): number {
        return this.portableVersion;
    }

    readClassDefinitionFromInput(input: DataInput, factoryId: number, classId: number, version: number): ClassDefinition {
        var register = true;
        var cdWriter = new ClassDefinitionWriter(this, factoryId, classId, version);
        input.readInt();

        var fieldCount = input.readInt();
        var offset = input.position();
        for (var i = 0; i < fieldCount; i++) {
            var pos = input.readInt(offset + i * BitsUtil.INT_SIZE_IN_BYTES);
            input.position(pos);

            var len = input.readShort();
            var chars = '';
            for (var j = 0; j < len; j++) {
                chars += String.fromCharCode(input.readUnsignedByte());
            }

            var type: FieldType = input.readByte();
            var name = chars;
            var fieldFactoryId = 0;
            var fieldClassId = 0;
            if (type === FieldType.PORTABLE) {
                //is null
                if (input.readBoolean()) {
                    register = false;
                }
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what there's a null inner Portable field
                if (register) {
                    var fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                }
            } else if (type === FieldType.PORTABLE_ARRAY) {
                var k = input.readInt();
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what there's a null inner Portable field
                if (k > 0) {
                    var p = input.readInt();
                    input.position(p);
                    var fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                } else {
                    register = false;
                }
            }
            cdWriter.addFieldByType(name, type, fieldFactoryId, fieldClassId);
        }
        cdWriter.end();
        var classDefinition = cdWriter.getDefinition();
        if (register) {
            classDefinition = cdWriter.registerAndGet();
        }
        return classDefinition;
    }

    lookupOrRegisterClassDefinition(portable: Portable): ClassDefinition {
        var version = this.getClassVersion(portable);
        var definition = this.lookupClassDefinition(portable.getFactoryId(), portable.getClassId(), version);
        if (definition == null) {
            definition = this.generateClassDefinitionForPortable(portable);
            this.registerClassDefinition(definition);
        }
        return definition;
    }

    lookupClassDefinition(factoryId: number, classId: number, version: number): ClassDefinition {
        var factory = this.classDefContext[factoryId];
        if (factory == null) {
            return null;
        } else {
            return factory.lookup(classId, version);
        }
    }

    generateClassDefinitionForPortable(portable: Portable): ClassDefinition {
        var version: number = this.getClassVersion(portable);
        var classDefinitionWriter = new ClassDefinitionWriter(this, portable.getFactoryId(), portable.getClassId(), version);
        portable.writePortable(classDefinitionWriter);
        classDefinitionWriter.end();
        return classDefinitionWriter.registerAndGet();
    }

    registerClassDefinition(classDefinition: ClassDefinition): ClassDefinition {
        var factoryId = classDefinition.getFactoryId();
        var classId = classDefinition.getClassId();
        var version = classDefinition.getVersion();
        if (!this.classDefContext[factoryId]) {
            this.classDefContext[factoryId] = new ClassDefinitionContext(factoryId, this.portableVersion);
        }
        return this.classDefContext[factoryId].register(classDefinition);
    }

    getClassVersion(portable: VersionedPortable | Portable): number {
        if ((<VersionedPortable>portable).getVersion) {
            return (<VersionedPortable>portable).getVersion();
        } else {
            return this.portableVersion;
        }
    }

}
