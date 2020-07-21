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
 * Type of the index.
 */
export enum IndexType {

    /**
     * Sorted index. Can be used with equality and range predicates.
     */
    SORTED = 'SORTED',

    /**
     * Hash index. Can be used with equality predicates.
     */
    HASH = 'HASH',

    /**
     * Bitmap index. Can be used with equality predicates.
     */
    BITMAP = 'BITMAP',

}

export const indexTypeToId = (type: IndexType): number => {
    switch (type) {
        case IndexType.SORTED:
            return 0;
        case IndexType.HASH:
            return 1;
        case IndexType.BITMAP:
            return 2;
        default:
            throw new TypeError('Unexpected type value: ' + type);
    }
}

export const indexTypeFromId = (typeId: number): IndexType => {
    switch (typeId) {
        case 0:
            return IndexType.SORTED;
        case 1:
            return IndexType.HASH;
        case 2:
            return IndexType.BITMAP;
        default:
            throw new TypeError('Unexpected type id: ' + typeId);
    }
}
