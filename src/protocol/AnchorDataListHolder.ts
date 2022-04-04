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
/** @ignore *//** */

import {Data} from '../serialization/Data';
import {SerializationService} from '../serialization/SerializationService';

/** @internal */
export class AnchorDataListHolder {
    anchorPageList: number[];
    anchorDataList: Array<[Data, Data]>;

    constructor(anchorPageList: number[], anchorDataList: Array<[Data, Data]>) {
        this.anchorPageList = anchorPageList;
        this.anchorDataList = anchorDataList;
    }

    asAnchorList<K, V>(serializationService: SerializationService): Array<[number, [K, V]]> {
        const anchorObjectList = new Array<[number, [K, V]]>(this.anchorDataList.length);
        for (let i = 0; i < this.anchorDataList.length; i++) {
            const dataEntry = this.anchorDataList[i];
            const pageNumber = this.anchorPageList[i];

            const key: K = serializationService.toObject(dataEntry[0]);
            const value: V = serializationService.toObject(dataEntry[1]);
            anchorObjectList[i] = [pageNumber, [key, value]];
        }

        return anchorObjectList;
    }
}
