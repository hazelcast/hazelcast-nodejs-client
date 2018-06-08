/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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
import {ImportConfig} from './ImportConfig';

export class SerializationConfig {
    defaultNumberType: string = 'double';
    isBigEndian: boolean = true;
    dataSerializableFactories: { [id: number]: IdentifiedDataSerializableFactory } = {};
    dataSerializableFactoryConfigs: { [id: number]: ImportConfig } = {};
    portableFactories: { [id: number]: PortableFactory } = {};
    portableFactoryConfigs: { [id: number]: ImportConfig } = {};
    portableVersion: number = 0;
    customSerializers: any[] = [];
    customSerializerConfigs: { [id: number]: ImportConfig } = {};
    globalSerializer: any = null;
    globalSerializerConfig: ImportConfig = null;
}
