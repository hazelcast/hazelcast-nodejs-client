/* tslint:disable:no-bitwise */
export enum EntryEventType {
    ADDED = 1 << 0,
    REMOVED = 1 << 1,
    UPDATED = 1 << 2,
    EVICTED = 1 << 3,
    EVICT_ALL = 1 << 4,
    CLEAR_ALL = 1 << 5,
    MERGED = 1 << 6,
    EXPIRED = 1 << 7,
    INVALIDATION = 1 << 8
}
