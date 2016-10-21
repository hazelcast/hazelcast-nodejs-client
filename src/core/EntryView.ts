import * as Long from 'long';
export class EntryView<K, V> {
    key: K;
    value: V;
    cost: Long;
    creationTime: Long;
    expirationTime: Long;
    hits: Long;
    lastAccessTime: Long;
    lastStoreTime: Long;
    lastUpdateTime: Long;
    version: Long;
    evictionCriteriaNumber: Long;
    ttl: Long;
}

