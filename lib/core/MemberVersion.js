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
exports.MemberVersion = void 0;
/** @internal */
class MemberVersion {
    constructor(major, minor, patch) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    /**
     * @param other other version to compare to
     * @param ignorePatchVersion whether patch in the version should be ignored
     * @return true if this version equals `other`
     */
    equals(other, ignorePatchVersion = false) {
        if (ignorePatchVersion) {
            return this.major === other.major && this.minor === other.minor;
        }
        else {
            return this.major === other.major && this.minor === other.minor && this.patch === other.patch;
        }
    }
    /**
     * @param ignorePatchVersion whether patch in the version should be ignored
     * @return string format of this `MemberVersion`
     */
    toString(ignorePatchVersion = false) {
        if (ignorePatchVersion) {
            return `${this.major}.${this.minor}`;
        }
        else {
            return `${this.major}.${this.minor}.${this.patch}`;
        }
    }
}
exports.MemberVersion = MemberVersion;
//# sourceMappingURL=MemberVersion.js.map