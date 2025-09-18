"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortableSerializer = void 0;
const PortableContext_1 = require("./PortableContext");
const DefaultPortableReader_1 = require("./DefaultPortableReader");
const MorphingPortableReader_1 = require("./MorphingPortableReader");
const DefaultPortableWriter_1 = require("./DefaultPortableWriter");
const core_1 = require("../../core");
/** @internal */
class PortableSerializer {
    constructor(serializationConfig) {
        this.id = -1;
        this.portableContext = new PortableContext_1.PortableContext(serializationConfig.portableVersion);
        this.factories = serializationConfig.portableFactories;
    }
    read(input) {
        const factoryId = input.readInt();
        const classId = input.readInt();
        return this.readObject(input, factoryId, classId);
    }
    readObject(input, factoryId, classId) {
        const version = input.readInt();
        const portable = this.createNewPortableInstance(factoryId, classId);
        let classDefinition = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (classDefinition == null) {
            const backupPos = input.position();
            try {
                classDefinition = this.portableContext.readClassDefinitionFromInput(input, factoryId, classId, version);
            }
            finally {
                input.position(backupPos);
            }
        }
        let reader;
        if (classDefinition.getVersion() === this.portableContext.getClassVersion(portable)) {
            reader = new DefaultPortableReader_1.DefaultPortableReader(this, input, classDefinition);
        }
        else {
            reader = new MorphingPortableReader_1.MorphingPortableReader(this, input, classDefinition);
        }
        portable.readPortable(reader);
        reader.end();
        return portable;
    }
    write(output, object) {
        output.writeInt(object.factoryId);
        output.writeInt(object.classId);
        this.writeObject(output, object);
    }
    writeObject(output, object) {
        const cd = this.portableContext.lookupOrRegisterClassDefinition(object);
        output.writeInt(cd.getVersion());
        const writer = new DefaultPortableWriter_1.DefaultPortableWriter(this, output, cd);
        object.writePortable(writer);
        writer.end();
    }
    createNewPortableInstance(factoryId, classId) {
        const factoryFn = this.factories[factoryId];
        if (factoryFn == null) {
            throw new core_1.HazelcastSerializationError(`There is no suitable portable factory for ${factoryId}.`);
        }
        const portable = factoryFn(classId);
        if (portable == null) {
            throw new core_1.HazelcastSerializationError(`Could not create Portable for class-id: ${classId}`);
        }
        return portable;
    }
}
exports.PortableSerializer = PortableSerializer;
//# sourceMappingURL=PortableSerializer.js.map