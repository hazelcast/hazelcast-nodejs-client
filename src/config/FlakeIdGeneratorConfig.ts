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


/**
 * Configuration to be used by the client for the specified FlakeIdGenerator.
 */
export interface FlakeIdGeneratorConfig {

    /**
     * Defines how many IDs are pre-fetched on the background when a new flake id
     * is requested from the cluster. Should be in the range `1..100000`.
     * By default, set to `100`.
     */
    prefetchCount?: number;

    /**
     * Defines for how long the pre-fetched IDs can be used. If this time elapsed,
     * a new batch of IDs will be fetched. Time unit is milliseconds. By default,
     * set to `600000` (10 minutes).
     * <p>
     * The IDs contain timestamp component, which ensures rough global ordering of IDs. If an ID
     * is assigned to an object that was created much later, it will be much out of order. If you don't care
     * about ordering, set this value to `0` for unlimited ID validity.
     */
    prefetchValidityMillis?: number;

}

export class FlakeIdGeneratorConfigImpl implements FlakeIdGeneratorConfig {

    /**
     * Name of the FlakeIdGenerator.
     */
    name: string;
    prefetchCount = 100;
    prefetchValidityMillis = 600000;

    toString(): string {
        return 'FlakeIdGeneratorConfig[' +
            'name: ' + this.name + ', ' +
            'prefetchCount: ' + this.prefetchCount + ', ' +
            'prefetchValidityMillis: ' + this.prefetchValidityMillis + ']';
    }

    clone(): FlakeIdGeneratorConfigImpl {
        const other = new FlakeIdGeneratorConfigImpl();
        Object.assign(other, this);
        return other;
    }

}
