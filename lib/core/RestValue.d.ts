import { IdentifiedDataSerializable } from '../serialization/Serializable';
import { DataInput, DataOutput } from '../serialization/Data';
/**
 * Wrapper for values stored via Hazelcast REST API.
 */
export declare class RestValue implements IdentifiedDataSerializable {
    /**
     * Wrapped value.
     */
    value: string;
    /**
     * HTTP Content-Type specified for the value.
     */
    contentType: string;
    /** @ignore */
    factoryId: number;
    /** @ignore */
    classId: number;
    /** @ignore */
    readData(input: DataInput): any;
    /** @ignore */
    writeData(output: DataOutput): void;
}
