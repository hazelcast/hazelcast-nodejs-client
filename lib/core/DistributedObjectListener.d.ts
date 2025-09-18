/**
 * Distributed object listener notifies when a distributed object
 * is created or destroyed cluster-wide.
 */
export declare type DistributedObjectListener = (event: DistributedObjectEvent) => void;
/**
 * DistributedObjectEvent is fired when a DistributedObject
 * is created or destroyed cluster-wide.
 */
export declare class DistributedObjectEvent {
    /**
     * The type of this event; one of 'created' or 'destroyed'.
     */
    eventType: string;
    /**
     * The service name of related DistributedObject.
     */
    serviceName: string;
    /**
     * The name of related DistributedObject.
     */
    objectName: string;
    constructor(eventType: string, serviceName: string, objectName: string);
}
