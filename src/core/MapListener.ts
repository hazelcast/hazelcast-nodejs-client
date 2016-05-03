export interface IMapListener<K, V> {
    added?: EntryEventListener<K, V>;
    removed?: EntryEventListener<K, V>;
    updated?: EntryEventListener<K, V>;
    merged?: EntryEventListener<K, V>;
    evicted?: EntryEventListener<K, V>;
    evictedAll?: EntryEventListener<K, V>;
    clearedAll?: EntryEventListener<K, V>;
    [event: string]: EntryEventListener<K, V>;
}

export interface EntryEventListener<K, V> {
    (key: K, oldValue: V, value: V, mergingValue: V): void;
}
