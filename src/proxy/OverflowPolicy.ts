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

/**
 * Overflow policy for Ringbuffer and Reliable Topic operations.
 */
export enum OverflowPolicy {

    /**
     * The new item will overwrite the oldest one regardless of the
     * configured time-to-live.
     */
    OVERWRITE = 'OVERWRITE',

    /**
     * Add operations will keep failing until the oldest item in this
     * ringbuffer will reach its time-to-live.
     */
    FAIL = 'FAIL',

}

/** @internal */
export const overflowPolicyToId = (type: OverflowPolicy): number => {
    switch (type) {
        case OverflowPolicy.OVERWRITE:
            return 0;
        case OverflowPolicy.FAIL:
            return 1;
        default:
            throw new TypeError('Unexpected type value: ' + type);
    }
}
