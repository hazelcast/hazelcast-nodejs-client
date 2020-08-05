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

import {DataInput, DataOutput} from './Data';
import {PortableReader, PortableWriter} from './portable/PortableSerializer';

/**
 * Defines interface for objects with IdentifiedDataSerializable
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
 * Factory responsible for creation of read
 * {@link IdentifiedDataSerializable} objects.
 */
export interface IdentifiedDataSerializableFactory {

    /**
     * Returns an instance of the right {@link IdentifiedDataSerializable} object,
     * given the classId.
     *
     * @param classId class id
     * @returns object for further initialization
     */
    create(classId: number): IdentifiedDataSerializable;

}

/**
 * Defines interface for objects with Portable serialization support.
 */
export interface Portable {

    /**
     * Factory id of the portable object.
     */
    factoryId: number;

    /**
     * Class id of the portable object.
     */
    classId: number;

    /**
     * Reads fields of the portable object from the binary representation.
     *
     * @param reader read helper
     */
    readPortable(reader: PortableReader): void;

    /**
     * Writes fields of the portable object into the binary representation.
     *
     * @param writer write helper
     */
    writePortable(writer: PortableWriter): void;

}

/**
 * Defines interface for Portable serialization with multiversion support.
 */
export interface VersionedPortable extends Portable {

    /**
     * Version of the portable object.
     */
    version: number;

}

/**
 * Factory responsible for creation of read
 * {@link Portable} objects.
 */
export interface PortableFactory {

    /**
     * Returns an instance of the right {@link Portable} object,
     * given the classId.
     *
     * @param classId class id
     * @returns object for further initialization
     */
    create(classId: number): Portable;

}

/**
 * Defines interface for objects with custom serialization support.
 */
export interface CustomSerializable {

    /**
     * Custom serializable id. Should match custom serializer's id.
     */
    hzCustomId: number;

}
