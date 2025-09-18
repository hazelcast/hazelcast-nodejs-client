import { Member } from '../core';
/**
 * Item event listener for IQueue, ISet, IList.
 */
export interface ItemListener<E> {
    /**
     * Triggered when an item is added.
     */
    itemAdded?: ItemEventListener<E>;
    /**
     * Triggered when an item is removed.
     */
    itemRemoved?: ItemEventListener<E>;
}
/**
 * Item event handler function.
 */
export declare type ItemEventListener<E> = (itemEvent: ItemEvent<E>) => void;
/**
 * IQueue, ISet, IList item event.
 */
export declare class ItemEvent<E> {
    /**
     * The name of the data structure for this event.
     */
    name: string;
    /**
     * The value of the item event.
     */
    item: E;
    /**
     * The member that fired this event.
     */
    member: Member;
}
