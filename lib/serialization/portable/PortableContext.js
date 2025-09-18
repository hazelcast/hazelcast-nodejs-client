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
exports.PortableContext = void 0;
const ClassDefinitionContext_1 = require("./ClassDefinitionContext");
const ClassDefinition_1 = require("./ClassDefinition");
const ClassDefinitionWriter_1 = require("./ClassDefinitionWriter");
const BitsUtil_1 = require("../../util/BitsUtil");
const Portable_1 = require("../Portable");
const ClassDefinitionBuilder_1 = require("./ClassDefinitionBuilder");
/** @internal */
class PortableContext {
    constructor(portableVersion) {
        this.version = portableVersion;
        this.classDefContext = {};
    }
    getVersion() {
        return this.version;
    }
    readClassDefinitionFromInput(input, factoryId, classId, version) {
        let register = true;
        const builder = new ClassDefinitionBuilder_1.ClassDefinitionBuilder(factoryId, classId, version);
        input.readInt();
        const fieldCount = input.readInt();
        const offset = input.position();
        for (let i = 0; i < fieldCount; i++) {
            const pos = input.readInt(offset + i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            input.position(pos);
            const len = input.readShort();
            let chars = '';
            for (let j = 0; j < len; j++) {
                chars += String.fromCharCode(input.readUnsignedByte());
            }
            const type = input.readByte();
            const name = chars;
            let fieldFactoryId = 0;
            let fieldClassId = 0;
            let fieldVersion = this.version;
            if (type === Portable_1.FieldType.PORTABLE) {
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
            }
            else if (type === Portable_1.FieldType.PORTABLE_ARRAY) {
                const k = input.readInt();
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();
                // TODO: what if there's a null inner Portable field
                if (k > 0) {
                    const p = input.readInt();
                    input.position(p);
                    fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                }
                else {
                    register = false;
                }
            }
            builder.addField(new ClassDefinition_1.FieldDefinition(i, name, type, fieldVersion, fieldFactoryId, fieldClassId));
        }
        let classDefinition = builder.build();
        if (register) {
            classDefinition = this.registerClassDefinition(classDefinition);
        }
        return classDefinition;
    }
    lookupOrRegisterClassDefinition(portable) {
        const portableVersion = this.getClassVersion(portable);
        let cd = this.lookupClassDefinition(portable.factoryId, portable.classId, portableVersion);
        if (cd == null) {
            const writer = new ClassDefinitionWriter_1.ClassDefinitionWriter(this, new ClassDefinitionBuilder_1.ClassDefinitionBuilder(portable.factoryId, portable.classId, portableVersion));
            portable.writePortable(writer);
            cd = writer.registerAndGet();
        }
        return cd;
    }
    lookupClassDefinition(factoryId, classId, version) {
        const factory = this.classDefContext[factoryId];
        if (factory == null) {
            return null;
        }
        else {
            return factory.lookup(classId, version);
        }
    }
    registerClassDefinition(classDefinition) {
        const factoryId = classDefinition.getFactoryId();
        if (!this.classDefContext[factoryId]) {
            this.classDefContext[factoryId] = new ClassDefinitionContext_1.ClassDefinitionContext(factoryId);
        }
        return this.classDefContext[factoryId].register(classDefinition);
    }
    getClassVersion(portable) {
        if (typeof portable.version === 'number') {
            if (portable.version < 0) {
                throw new RangeError('Version cannot be negative!');
            }
            return portable.version;
        }
        else {
            return this.version;
        }
    }
}
exports.PortableContext = PortableContext;
//# sourceMappingURL=PortableContext.js.map