import { DataInput, DataOutput } from './Data';
/**
 * Defines a common interface for default and custom serializers.
 */
export interface Serializer<T = any> {
    /**
     * Type id.
     */
    id: number;
    /**
     * Deserializes input data into an object.
     *
     * @param input input data reader
     */
    read(input: DataInput): T;
    /**
     * Serializes an object into binary data.
     *
     * @param output output data writer
     * @param object object to be serialized
     */
    write(output: DataOutput, object: T): void;
}
/**
 * Interface for objects with IdentifiedDataSerializable
 * serialization support.
 */
export interface IdentifiedDataSerializable {
    /**
     * Factory id of the object.
     */
    factoryId: number;
    /**
     * Class id of the object.
     */
    classId: number;
    /**
     * Reads fields of the object from the binary representation.
     *
     * @param input read helper
     */
    readData(input: DataInput): void;
    /**
     * Writes fields of the object into the binary representation.
     *
     * @param output write helper
     */
    writeData(output: DataOutput): void;
}
/**
 * Factory function for {@link IdentifiedDataSerializable}. Should return
 * an instance of the right {@link IdentifiedDataSerializable} object, given
 * the matching `classId`.
 *
 * @param classId class id
 * @returns object for further initialization
 */
export declare type IdentifiedDataSerializableFactory = (classId: number) => IdentifiedDataSerializable;
/**
 * Interface for objects with custom serialization support.
 */
export interface CustomSerializable {
    /**
     * Custom serializable id. Should match custom serializer's id.
     */
    hzCustomId: number;
}
