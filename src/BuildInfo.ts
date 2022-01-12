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
/** @ignore *//** */
import {MemberVersion} from './core/MemberVersion';

const clientVersion = require('../package.json').version;

/** @internal */
export class BuildInfo {

    public static readonly UNKNOWN_VERSION_ID = -1;
    private static readonly MAJOR_VERSION_MULTIPLIER = 10000;
    private static readonly MINOR_VERSION_MULTIPLIER = 100;

    public static calculateServerVersionFromString(versionString: string): number {
        if (versionString == null) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        }
        const mainParts = versionString.split('-');
        const tokens = mainParts[0].split('.');

        if (tokens.length < 2) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        }

        const major = +tokens[0];
        const minor = +tokens[1];
        let patch: number;
        if (tokens.length === 2) {
            patch = 0;
        } else {
            patch = +tokens[2];
        }
        const version = this.calculateServerVersion(major, minor, patch);
        if (isNaN(version)) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        } else {
            return version;
        }
    }

    public static calculateServerVersion(major: number, minor: number, patch: number): number {
        return BuildInfo.MAJOR_VERSION_MULTIPLIER * major + BuildInfo.MINOR_VERSION_MULTIPLIER * minor + patch;
    }

    public static getClientVersion(): string {
        return clientVersion;
    }

    public static calculateMemberVersion(m: MemberVersion) : number {
        return BuildInfo.calculateServerVersion(m.major, m.minor, m.patch);
    }
}
