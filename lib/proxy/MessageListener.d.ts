import * as Long from 'long';
import { Address } from '../core';
/**
 * Message listener for Reliable Topic.
 */
export declare type MessageListener<E> = (message: Message<E>) => void;
/**
 * Message of Reliable Topic.
 */
export declare class Message<T> {
    /**
     * Published message.
     */
    messageObject: T;
    /**
     * Address of the member that published the message.
     */
    publisher: Address;
    /**
     * Time when the message was published (Epoch time).
     */
    publishingTime: Long;
}
