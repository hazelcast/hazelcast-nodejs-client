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

import {TopicOverloadPolicy} from '../proxy';

/**
 * Configuration to be used by the client for the specified ReliableTopic.
 */
export interface ReliableTopicConfig {

    /**
     * Minimum number of messages that Reliable Topic tries to read in batches. By default, set to `10`.
     */
    readBatchSize?: number;

    /**
     * Policy to handle an overloaded topic. Available values are `DISCARD_OLDEST`,
     * `DISCARD_NEWEST`, `BLOCK` and `ERROR`. By default, set to `BLOCK`.
     */
    overloadPolicy?: TopicOverloadPolicy;

}

/** @internal */
export class ReliableTopicConfigImpl implements ReliableTopicConfig {

    /**
     * Name of the ReliableTopic.
     */
    name: string;
    readBatchSize = 10;
    overloadPolicy: TopicOverloadPolicy = TopicOverloadPolicy.BLOCK;

    toString(): string {
        return 'ReliableTopicConfig[' +
            'name: ' + this.name + ', ' +
            'readBatchSize: ' + this.readBatchSize + ', ' +
            'overloadPolicy: ' + this.overloadPolicy + ']';
    }

    clone(): ReliableTopicConfigImpl {
        const other = new ReliableTopicConfigImpl();
        Object.assign(other, this);
        return other;
    }

}
