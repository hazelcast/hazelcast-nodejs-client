"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolType = exports.EndpointQualifier = void 0;
/** @internal */
class EndpointQualifier {
    constructor(type, identifier) {
        this.type = type;
        this.identifier = identifier;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        if (this.type !== other.type) {
            return false;
        }
        return this.identifier === other.identifier;
    }
    toString() {
        return 'EndpointQualifier[type: ' + this.type
            + ', identifier: ' + this.identifier + ']';
    }
}
exports.EndpointQualifier = EndpointQualifier;
/** @internal */
var ProtocolType;
(function (ProtocolType) {
    ProtocolType[ProtocolType["MEMBER"] = 0] = "MEMBER";
    ProtocolType[ProtocolType["CLIENT"] = 1] = "CLIENT";
    ProtocolType[ProtocolType["WAN"] = 2] = "WAN";
    ProtocolType[ProtocolType["REST"] = 3] = "REST";
    ProtocolType[ProtocolType["MEMCACHE"] = 4] = "MEMCACHE";
})(ProtocolType = exports.ProtocolType || (exports.ProtocolType = {}));
//# sourceMappingURL=EndpointQualifier.js.map