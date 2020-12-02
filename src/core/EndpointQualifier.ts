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
/** @ignore *//** */

/** @internal */
export class EndpointQualifier {

    type: number;
    identifier: string;

    constructor(type: number, identifier: string) {
        this.type = type;
        this.identifier = identifier;
    }

    equals(other: EndpointQualifier): boolean {
        if (other == null) {
            return false;
        }
        if (this.type !== other.type) {
            return false;
        }
        return this.identifier === other.identifier;
    }

    toString(): string {
        return 'EndpointQualifier[type: ' + this.type
            + ', identifier: ' + this.identifier + ']';
    }
}

/** @internal */
export enum ProtocolType {

    MEMBER = 0,
    CLIENT = 1,
    WAN = 2,
    REST = 3,
    MEMCACHE = 4,

}
