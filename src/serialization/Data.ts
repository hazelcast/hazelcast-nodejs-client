import Promise = Q.Promise;
export interface Data {
    /**
     * Returns serialized representation in a buffer
     */
    toBuffer() : Buffer;

    /**
     * Returns serialization type
     */
    getType() : number;

    /**
     * Returns the total size of data in bytes
     */
    totalSize() : number;

    /**
     * Returns size of internal binary data in bytes
     */
    dataSize() : number;

    /**
     * Returns approximate heap cost of this Data object in bytes
     */
    getHeapCost() : number;

    /**
     * Returns partition hash of serialized object
     */
    getPartitionHash() : number;

    /**
     * Returns true if data has partition hash
     */
    hasPartitionHash() : boolean;

    /**
     * Returns true if the object is a portable object
     */
    isPortable() : boolean;

}
