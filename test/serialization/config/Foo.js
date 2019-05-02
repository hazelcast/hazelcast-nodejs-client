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


function Foo(foo) {
    this.foo = foo;
}

Foo.prototype.getClassId = function () {
    return 1;
}

Foo.prototype.getFactoryId = function () {
    return 1;
}

Foo.prototype.writePortable = function (portableWriter) {
    portableWriter.writeUTF('foo', this.foo);
}

Foo.prototype.readPortable = function (portableReader) {
    this.foo = portableReader.readUTF('foo');
}

function MyPortableFactory() {

}

MyPortableFactory.prototype.create = function (type) {
    if (type === 1) {
        return new Foo();
    }
}

exports.MyPortableFactory = MyPortableFactory;
exports.Foo = Foo;
