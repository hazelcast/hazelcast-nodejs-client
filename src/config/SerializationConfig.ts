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

import {IdentifiedDataSerializableFactory, PortableFactory} from '../serialization/Serializable';
import {JsonStringDeserializationPolicy} from './JsonStringDeserializationPolicy';
import {StringSerializationPolicy} from './StringSerializationPolicy';

export class SerializationConfig {
    defaultNumberType: string = 'double';
    isBigEndian: boolean = true;
    dataSerializableFactories: { [id: number]: IdentifiedDataSerializableFactory } = {};
    portableFactories: { [id: number]: PortableFactory } = {};
    portableVersion: number = 0;
    customSerializers: any[] = [];
    globalSerializer: any = null;
    jsonStringDeserializationPolicy: JsonStringDeserializationPolicy = JsonStringDeserializationPolicy.EAGER;
    stringSerializationPolicy: StringSerializationPolicy = StringSerializationPolicy.STANDARD;
}
