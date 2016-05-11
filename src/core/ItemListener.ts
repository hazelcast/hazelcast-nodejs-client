import {Member} from '../Member';
export interface ItemListener<E> {
    itemAdded?: ItemEventListener<E>;
    itemRemoved?: ItemEventListener<E>;
}

export interface ItemEventListener<E> {
    (item: E, member: Member, eventType: ItemEventType): void;
}

export enum ItemEventType {
    ADDED = 1,
    REMOVED = 2
}
