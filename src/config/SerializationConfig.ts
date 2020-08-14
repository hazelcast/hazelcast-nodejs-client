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

import {
    IdentifiedDataSerializableFactory,
    PortableFactory,
    CustomSerializable,
} from '../serialization/Serializable';
import {Serializer} from '../serialization/DefaultSerializer';
import {JsonStringDeserializationPolicy} from './JsonStringDeserializationPolicy';

/**
 * User-defined serialization config for the client.
 */
export interface SerializationConfig {

    /**
     * Defines how the `number` type is represented on the cluster side. By default, it is serialized as `Double`.
     */
    defaultNumberType?: string;

    /**
     * Defines if big-endian is used as the byte order for the serialization. By default, set to `true`.
     */
    isBigEndian?: boolean;

    /**
     * Defines IdentifiedDataSerializableFactory serialization factories.
     */
    dataSerializableFactories?: { [id: number]: IdentifiedDataSerializableFactory };

    /**
     * Defines Portable serialization factories.
     */
    portableFactories?: { [id: number]: PortableFactory };

    /**
     * Defines portable version number. By default, set to `0`.
     */
    portableVersion?: number;

    /**
     * Defines Custom serializers.
     */
    customSerializers?: Array<Serializer<CustomSerializable>>;

    /**
     * Defines the global serializer. This serializer is registered as a fallback serializer
     * to handle all other objects if a serializer cannot be located for them.
     */
    globalSerializer?: Serializer;

    /**
     * Defines JSON deserialization policy. By default, set to `eager`.
     */
    jsonStringDeserializationPolicy?: JsonStringDeserializationPolicy;

}

/** @internal */
export class SerializationConfigImpl implements SerializationConfig {

    defaultNumberType = 'double';
    isBigEndian = true;
    dataSerializableFactories: { [id: number]: IdentifiedDataSerializableFactory } = {};
    portableFactories: { [id: number]: PortableFactory } = {};
    portableVersion = 0;
    customSerializers: Array<Serializer<CustomSerializable>> = [];
    globalSerializer: Serializer = null;
    jsonStringDeserializationPolicy: JsonStringDeserializationPolicy = JsonStringDeserializationPolicy.EAGER;

}
