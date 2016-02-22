import {Data} from './Data';
import murmur = require('../invocation/Murmur');

const PARTITION_HASH_OFFSET: number = 0;
const TYPE_OFFSET: number = 4;
const DATA_OFFSET: number = 8;
const HEAP_DATA_OVERHEAD: number = DATA_OFFSET;

export class HeapData implements Data {

    private payload: Buffer;

    constructor(buffer: Buffer) {
        if (buffer != null && buffer.length > 0 && buffer.length < HEAP_DATA_OVERHEAD) {
            throw new Error('Data should be either empty or should contain more than ' + HEAP_DATA_OVERHEAD
                + ' bytes! -> '
                + buffer);
        }
        this.payload = buffer;
    }

    /**
     * Returns serialized representation in a buffer
     */
    public toBuffer() : Buffer {
        return this.payload;
    }

    /**
     * Returns serialization type
     */
    public getType() : number {
        if (this.totalSize() === 0) {
            //TODO serialization null type
            return 0;
        }
        return this.payload.readIntBE(TYPE_OFFSET, 4);
    }

    /**
     * Returns the total size of data in bytes
     */
    public totalSize(): number {
        if (this.payload === null) {
            return 0;
        } else {
            return this.payload.length;
        }
    }

    /**
     * Returns size of internal binary data in bytes
     */
    public dataSize() : number {
        return Math.max(this.totalSize() - HEAP_DATA_OVERHEAD, 0);
    }

    /**
     * Returns approximate heap cost of this Data object in bytes
     */
    getHeapCost(): number {
        return 0;
    }

    /**
     * Returns partition hash of serialized object
     */
    getPartitionHash() : number {
        if (this.hasPartitionHash()) {
            return this.payload.readIntBE(PARTITION_HASH_OFFSET, 4);
        } else {
            return murmur(this.payload.slice(DATA_OFFSET));
        }
    }

    /**
     * Returns true if data has partition hash
     */
    hasPartitionHash() : boolean {
        return this.payload !== null
            && this.payload.length >= HEAP_DATA_OVERHEAD
            && this.payload.readIntBE(PARTITION_HASH_OFFSET, 4) !== 0;
    }

    /**
     * Returns true if the object is a portable object
     */
    isPortable(): boolean {
        return false;
    }

}
