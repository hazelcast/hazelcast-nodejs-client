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

import {AnchorDataListHolder} from './AnchorDataListHolder';
import {Data} from '../serialization/Data';
import {SerializationService} from '../serialization/SerializationService';
import {PagingPredicateImpl} from '../serialization/DefaultPredicates';
import {iterationTypeToId} from '../core/Predicate';

/** @internal */
export class PagingPredicateHolder {

    anchorDataListHolder: AnchorDataListHolder;
    predicateData: Data;
    comparatorData: Data;
    pageSize: number;
    page: number;
    iterationTypeId: number;
    partitionKeyData: Data;

    constructor(anchorDataListHolder: AnchorDataListHolder, predicateData: Data, comparatorData: Data,
                pageSize: number, page: number, iterationTypeId: number, partitionKeyData: Data) {
        this.anchorDataListHolder = anchorDataListHolder;
        this.predicateData = predicateData;
        this.comparatorData = comparatorData;
        this.pageSize = pageSize;
        this.page = page;
        this.iterationTypeId = iterationTypeId;
        this.partitionKeyData = partitionKeyData;
    }

    static of(predicate: PagingPredicateImpl, serializationService: SerializationService): PagingPredicateHolder {
        if (predicate == null) {
            return null;
        }
        return this.buildHolder(serializationService, predicate);
    }

    private static buildHolder(serializationService: SerializationService,
                               predicate: PagingPredicateImpl): PagingPredicateHolder {
        const anchorList = predicate.getAnchorList();
        const anchorDataList = new Array<[Data, Data]>(anchorList.length);
        const pageList = new Array<number>(anchorList.length);

        for (let i = 0; i < anchorList.length; i++) {
            const item = anchorList[i];
            pageList[i] = item[0];
            const anchorEntry = item[1];
            anchorDataList[i] =
                [serializationService.toData(anchorEntry[0]), serializationService.toData(anchorEntry[1])];
        }

        const anchorDataListHolder = new AnchorDataListHolder(pageList, anchorDataList);
        const predicateData = serializationService.toData(predicate.getPredicate());
        const comparatorData = serializationService.toData(predicate.getComparator());
        const iterationTypeId = iterationTypeToId(predicate.getIterationType());
        return new PagingPredicateHolder(anchorDataListHolder, predicateData, comparatorData,
            predicate.getPageSize(), predicate.getPage(), iterationTypeId, null);
    }
}
