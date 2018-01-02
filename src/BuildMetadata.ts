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

export class BuildMetadata {
    public static readonly UNKNOWN_VERSION_ID = -1;

    private static readonly MAJOR_VERSION_MULTIPLIER = 10000;
    private static readonly MINOR_VERSION_MULTIPLIER = 100;

    private static readonly PATTERN = /^([\d]+)\.([\d]+)(?:\.([\d]+))?(-[\w]+)?(-SNAPSHOT)?$/;

    public static calculateVersion(versionString: string): number {
        if (versionString == null) {
            return BuildMetadata.UNKNOWN_VERSION_ID;
        }
        const info = BuildMetadata.PATTERN.exec(versionString);
        if (info == null) {
            return -1;
        }
        const major = Number.parseInt(info[1]);
        const minor = Number.parseInt(info[2]);
        let patch: number;
        if (info[3] == null) {
            patch = 0;
        } else {
            patch = Number.parseInt(info[3]);
        }
        return BuildMetadata.MAJOR_VERSION_MULTIPLIER * major + BuildMetadata.MINOR_VERSION_MULTIPLIER * minor + patch;
    }

}

