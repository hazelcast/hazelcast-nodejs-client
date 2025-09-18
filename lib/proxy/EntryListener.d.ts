import { MapEventListener } from './MapListener';
import { Member } from '../core';
/**
 * An interface which is used to get notified upon a map or an entry event.
 */
export interface EntryListener<K, V> {
    added?: EntryEventListener<K, V>;
    removed?: EntryEventListener<K, V>;
    updated?: EntryEventListener<K, V>;
    merged?: EntryEventListener<K, V>;
    evicted?: EntryEventListener<K, V>;
    expired?: EntryEventListener<K, V>;
    loaded?: EntryEventListener<K, V>;
    mapEvicted?: MapEventListener<K, V>;
    mapCleared?: MapEventListener<K, V>;
    [event: string]: EntryEventListener<K, V> | MapEventListener<K, V> | undefined;
}
/**
 * A type which is used for entry events.
 */
export declare type EntryEventListener<K, V> = (entryEvent: EntryEvent<K, V>) => void;
/**
 * Map Entry event.
 */
export declare class EntryEvent<K, V> {
    /**
     * The name of the map for this event.
     */
    name: string;
    /**
     * The key of the entry event.
     */
    key: K;
    /**
     * The value of the entry event.
     */
    value: V;
    /**
     * The old value of the entry event.
     */
    oldValue: V;
    /**
     * The incoming merging value of the entry event.
     */
    mergingValue: V;
    /**
     * The member that fired this event.
     */
    member: Member;
    constructor(name: string, key: K, value: V, oldValue: V, mergingValue: V, member: Member);
}
