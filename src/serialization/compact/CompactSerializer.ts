/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {CompactReader} from './CompactReader';
import {CompactWriter} from './CompactWriter';

/**
 * Defines the contract of the serializers used for Compact
 * serialization.
 *
 * After defining a serializer for the objects of the class `C`,
 * it can be registered using the {@link ClientConfig.serialization.compact.serializers}.
 *
 * {@link write} and {@link read} methods must be consistent with each other.
 *
 * For more information about usage serializers, please see Node.js client documentation and code samples.
 */
 export interface CompactSerializer<C> {
    /**
     * The class which the serializer is written for. You need to give the class
     * constructor to this property. For example, if a class is instantiated with `new Employee()`,
     * class constructor is `Employee`. `class` is used to check a class instance compact
     * serializable.
     */
    class: new (...args: any[]) => any;

    /**
     * The type name of the registered class. Type name is written into the serialized data and used while deserialization.
     * This should have the same value with what other members of the cluster have. While deserializing there should be
     * a matching serializer otherwise a {@link GenericRecord} will be returned.
     */
    typeName: string;

    /**
     * This method should construct a class instance and return it.
     * @param reader reader to read fields of an object
     * @return the class instance created as a result of read method.
     * @throws {@link HazelcastSerializationError} in case of failure to read
     */
    read(reader: CompactReader): C;

    /**
     * This method should write a class instance's fields into writer.
     * @param writer CompactWriter to serialize the fields onto
     * @param instance class instance to be serialized.
     * @throws {@link HazelcastSerializationError} in case of failure to write
     */
    write(writer: CompactWriter, instance: C): void;
}
