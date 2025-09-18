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
exports.PagingPredicateHolder = void 0;
const AnchorDataListHolder_1 = require("./AnchorDataListHolder");
const Predicate_1 = require("../core/Predicate");
/** @internal */
class PagingPredicateHolder {
    constructor(anchorDataListHolder, predicateData, comparatorData, pageSize, page, iterationTypeId, partitionKeyData) {
        this.anchorDataListHolder = anchorDataListHolder;
        this.predicateData = predicateData;
        this.comparatorData = comparatorData;
        this.pageSize = pageSize;
        this.page = page;
        this.iterationTypeId = iterationTypeId;
        this.partitionKeyData = partitionKeyData;
    }
    static of(predicate, serializationService) {
        if (predicate == null) {
            return null;
        }
        return this.buildHolder(serializationService, predicate);
    }
    static buildHolder(serializationService, predicate) {
        const anchorList = predicate.getAnchorList();
        const anchorDataList = new Array(anchorList.length);
        const pageList = new Array(anchorList.length);
        for (let i = 0; i < anchorList.length; i++) {
            const item = anchorList[i];
            pageList[i] = item[0];
            const anchorEntry = item[1];
            anchorDataList[i] =
                [serializationService.toData(anchorEntry[0]), serializationService.toData(anchorEntry[1])];
        }
        const anchorDataListHolder = new AnchorDataListHolder_1.AnchorDataListHolder(pageList, anchorDataList);
        const predicateData = serializationService.toData(predicate.getPredicate());
        const comparatorData = serializationService.toData(predicate.getComparator());
        const iterationTypeId = (0, Predicate_1.iterationTypeToId)(predicate.getIterationType());
        return new PagingPredicateHolder(anchorDataListHolder, predicateData, comparatorData, predicate.getPageSize(), predicate.getPage(), iterationTypeId, null);
    }
}
exports.PagingPredicateHolder = PagingPredicateHolder;
//# sourceMappingURL=PagingPredicateHolder.js.map