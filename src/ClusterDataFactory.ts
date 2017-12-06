/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

import {IdentifiedDataSerializableFactory, IdentifiedDataSerializable} from './serialization/Serializable';
import Address = require('./Address');

export const ADDRESS_CLASS_ID = 1;
export const CLUSTER_DATA_FACTORY_ID = 0;

export class ClusterDataFactory implements IdentifiedDataSerializableFactory {

    create(type: number): IdentifiedDataSerializable {

        if (type === ADDRESS_CLASS_ID) {
            return new Address();
        }

        return null;
    }
}
