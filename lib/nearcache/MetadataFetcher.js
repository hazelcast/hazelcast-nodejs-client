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
exports.MetadataFetcher = void 0;
const MapFetchNearCacheInvalidationMetadataCodec_1 = require("../codec/MapFetchNearCacheInvalidationMetadataCodec");
const MemberSelector_1 = require("../core/MemberSelector");
const InvocationService_1 = require("../invocation/InvocationService");
/** @internal */
class MetadataFetcher {
    constructor(logger, invocationService, clusterService) {
        this.logger = logger;
        this.invocationService = invocationService;
        this.clusterService = clusterService;
    }
    initHandler(handler) {
        const scanPromises = this.scanMembers([handler.getName()]);
        return Promise.all(scanPromises).then((responses) => {
            responses.forEach((response) => {
                const metadata = MapFetchNearCacheInvalidationMetadataCodec_1.MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(response);
                handler.initUuid(metadata.partitionUuidList);
                handler.initSequence(metadata.namePartitionSequenceList[0]);
            });
        });
    }
    fetchMetadata(handlers) {
        const objectNames = this.getObjectNames(handlers);
        const promises = this.scanMembers(objectNames);
        return Promise.all(promises).then((clientMessages) => {
            clientMessages.forEach((response) => {
                this.processResponse(response, handlers);
            });
        });
    }
    processResponse(responseMessage, handlers) {
        const metadata = MapFetchNearCacheInvalidationMetadataCodec_1.MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(responseMessage);
        handlers.forEach((handler) => {
            try {
                this.repairUuids(handler, metadata.partitionUuidList);
                this.repairSequences(handler, metadata.namePartitionSequenceList);
            }
            catch (e) {
                this.logger.warn('MetadataFetcher', 'Can not get invalidation metadata ' + e.message);
            }
        });
    }
    repairUuids(handler, partitionIdUuidList) {
        partitionIdUuidList.forEach((entry) => {
            handler.checkOrRepairUuid(entry[0], entry[1]);
        });
    }
    repairSequences(handler, partitionIdSequenceList) {
        partitionIdSequenceList.forEach((partitionIdSeq) => {
            const pairs = partitionIdSeq[1];
            pairs.forEach((pair) => {
                handler.checkOrRepairSequence(pair[0], pair[1], true);
            });
        });
    }
    scanMembers(objectNames) {
        const members = this.clusterService.getMembers(MemberSelector_1.dataMemberSelector);
        const promises = [];
        members.forEach((member) => {
            const request = MapFetchNearCacheInvalidationMetadataCodec_1.MapFetchNearCacheInvalidationMetadataCodec.encodeRequest(objectNames, member.uuid);
            const promise = this.invocationService.invoke(new InvocationService_1.Invocation(this.invocationService, request));
            promises.push(promise);
        });
        return promises;
    }
    getObjectNames(handlers) {
        const names = [];
        handlers.forEach((handler) => {
            names.push(handler.getName());
        });
        return names;
    }
}
exports.MetadataFetcher = MetadataFetcher;
//# sourceMappingURL=MetadataFetcher.js.map