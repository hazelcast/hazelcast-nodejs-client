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
/** @ignore *//** */

import {PortableContext} from './PortableContext';
import {Portable, PortableFactory} from '../Portable';
import {Serializer} from '../Serializable';
import {DataInput, PositionalDataOutput} from '../Data';
import {DefaultPortableReader} from './DefaultPortableReader';
import {MorphingPortableReader} from './MorphingPortableReader';
import {ClassDefinition} from './ClassDefinition';
import {DefaultPortableWriter} from './DefaultPortableWriter';
import {SerializationConfigImpl} from '../../config/SerializationConfig';
import {HazelcastSerializationError} from '../../core';

/** @internal */
export class PortableSerializer implements Serializer {

    id = -1;
    private readonly portableContext: PortableContext;
    private readonly factories: { [id: number]: PortableFactory };

    constructor(serializationConfig: SerializationConfigImpl) {
        this.portableContext = new PortableContext(serializationConfig.portableVersion);
        this.factories = serializationConfig.portableFactories;
    }

    read(input: DataInput): any {
        const factoryId = input.readInt();
        const classId = input.readInt();
        return this.readObject(input, factoryId, classId);
    }

    readObject(input: DataInput, factoryId: number, classId: number): Portable {
        const version = input.readInt();

        const portable = this.createNewPortableInstance(factoryId, classId);
        let classDefinition = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (classDefinition == null) {
            const backupPos = input.position();
            try {
                classDefinition = this.portableContext.readClassDefinitionFromInput(input, factoryId, classId, version);
            } finally {
                input.position(backupPos);
            }
        }
        let reader: DefaultPortableReader;
        if (classDefinition.getVersion() === this.portableContext.getClassVersion(portable)) {
            reader = new DefaultPortableReader(this, input, classDefinition);
        } else {
            reader = new MorphingPortableReader(this, input, classDefinition);
        }
        portable.readPortable(reader);
        reader.end();
        return portable;
    }

    write(output: PositionalDataOutput, object: Portable): void {
        output.writeInt(object.factoryId);
        output.writeInt(object.classId);

        this.writeObject(output, object);
    }

    writeObject(output: PositionalDataOutput, object: Portable): void {
        const cd: ClassDefinition = this.portableContext.lookupOrRegisterClassDefinition(object);

        output.writeInt(cd.getVersion());
        const writer = new DefaultPortableWriter(this, output, cd);
        object.writePortable(writer);
        writer.end();
    }

    private createNewPortableInstance(factoryId: number, classId: number): Portable {
        const factoryFn = this.factories[factoryId];
        if (factoryFn == null) {
            throw new HazelcastSerializationError(`There is no suitable portable factory for ${factoryId}.`);
        }
        const portable: Portable = factoryFn(classId);
        if (portable == null) {
            throw new HazelcastSerializationError(`Could not create Portable for class-id: ${classId}`);
        }
        return portable;
    }
}
