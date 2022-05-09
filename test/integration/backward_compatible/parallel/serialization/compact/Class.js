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
'use strict';

class A {
    constructor(age) {
        this.age = age;
    }
}

class ASerializer {
    getClass() {
        return A;
    }

    getTypeName() {
        return 'A';
    }

    read(reader) {
        const age = reader.readInt32('age');
        return new A(age);
    }
    write(writer, obj) {
        writer.writeInt32('age', obj.age);
    }
}

module.exports = {ASerializer, A};
