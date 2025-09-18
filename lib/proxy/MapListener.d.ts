import { EntryListener } from './EntryListener';
import { Member } from '../core';
/**
 * Map or entry level event listener.
 */
export interface MapListener<K, V> extends EntryListener<K, V> {
}
/**
 * Map event handler function.
 */
export declare type MapEventListener<K, V> = (mapEvent: MapEvent) => void;
/**
 * Used for map-wide events.
 */
export declare class MapEvent {
    /**
     * The name of the map for this event.
     */
    name: string;
    /**
     * Number of entries affected by this event.
     */
    numberOfAffectedEntries: number;
    /**
     * The member that fired this event.
     */
    member: Member;
    constructor(name: string, numberOfAffectedEntries: number, member: Member);
}
