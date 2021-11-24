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

import {DataInput, DataOutput} from './Data';

/**
 * Defines an interface for sync serializers.
 */
export interface Serializer<T = any> {

    /**
     * Type id.
     */
    id: number;

    /**
     * Deserializes input data into an object.
     *
     * @param input input data reader
     */
    read(input: DataInput): T;

    /**
     * Serializes an object into binary data.
     *
     * @param output output data writer
     * @param object object to be serialized
     */
    write(output: DataOutput, object: T): void;

}

/**
 * Defines an interface for async serializers.
 */
export interface AsyncSerializer<T = any> {

    /**
     * Type id.
     */
    id: number;

    /**
     * Deserializes input data into an object.
     *
     * @param input input data reader
     */
    read(input: DataInput): Promise<T>;

    /**
     * Serializes an object into binary data.
     *
     * @param output output data writer
     * @param object object to be serialized
     */
    write(output: DataOutput, object: T): Promise<void>;

}

/**
 * Interface for objects with IdentifiedDataSerializable
 * serialization support.
 */
export interface IdentifiedDataSerializable {

    /**
     * Factory id of the object.
     */
    factoryId: number;

    /**
     * Class id of the object.
     */
    classId: number;

    /**
     * Reads fields of the object from the binary representation.
     *
     * @param input read helper
     */
    readData(input: DataInput): void;

    /**
     * Writes fields of the object into the binary representation.
     *
     * @param output write helper
     */
    writeData(output: DataOutput): void;

}

/**
 * Factory function for {@link IdentifiedDataSerializable}. Should return
 * an instance of the right {@link IdentifiedDataSerializable} object, given
 * the matching `classId`.
 *
 * @param classId class id
 * @returns object for further initialization
 */
export type IdentifiedDataSerializableFactory = (classId: number) => IdentifiedDataSerializable;

/**
 * Interface for objects with custom serialization support.
 */
export interface CustomSerializable {

    /**
     * Custom serializable id. Should match custom serializer's id.
     */
    hzCustomId: number;

}
