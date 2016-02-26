/* tslint:disable:no-bitwise */
import {Data} from './serialization/Data';
import Address = require('./Address');
export class BitsUtil {
    static EVENT_MEMBER = 200;
    static EVENT_MEMBERLIST = 201;
    static EVENT_MEMBERATTRIBUTECHANGE = 202;
    static EVENT_ENTRY = 203;
    static EVENT_ITEM = 204;
    static EVENT_TOPIC = 205;
    static EVENT_PARTITIONLOST = 206;
    static EVENT_DISTRIBUTEDOBJECT = 207;
    static EVENT_CACHEINVALIDATION = 208;
    static EVENT_MAPPARTITIONLOST = 209;
    static EVENT_CACHE = 210;
    static EVENT_CACHEBATCHINVALIDATION = 211;
    static EVENT_QUERYCACHESINGLE = 212;
    static EVENT_QUERYCACHEBATCH = 213;

    static EVENT_CACHEPARTITIONLOST = 214;
    static EVENT_IMAPINVALIDATION = 215;
    static EVENT_IMAPBATCHINVALIDATION = 216;
    static BYTE_SIZE_IN_BYTES: number = 1;
    static BOOLEAN_SIZE_IN_BYTES: number = 1;
    static SHORT_SIZE_IN_BYTES: number = 2;
    static CHAR_SIZE_IN_BYTES: number = 2;
    static INT_SIZE_IN_BYTES: number = 4;
    static FLOAT_SIZE_IN_BYTES: number = 4;
    static LONG_SIZE_IN_BYTES: number = 8;
    static DOUBLE_SIZE_IN_BYTES: number = 8;

    static BIG_ENDIAN: number = 2;
    static LITTLE_ENDIAN: number = 1;

    static VERSION: number = 1;
    static BEGIN_FLAG: number = 0x80;
    static END_FLAG: number = 0x40;
    static BEGIN_END_FLAG: number = BitsUtil.BEGIN_FLAG | BitsUtil.END_FLAG;
    static LISTENER_FLAG: number = 0x01;

    static SIZE_OFFSET: number = 0;

    static FRAME_LENGTH_FIELD_OFFSET: number = 0;
    static VERSION_FIELD_OFFSET: number = BitsUtil.FRAME_LENGTH_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
    static FLAGS_FIELD_OFFSET: number = BitsUtil.VERSION_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static TYPE_FIELD_OFFSET: number = BitsUtil.FLAGS_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static CORRELATION_ID_FIELD_OFFSET: number = BitsUtil.TYPE_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
    static PARTITION_ID_FIELD_OFFSET: number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    static DATA_OFFSET_FIELD_OFFSET: number = BitsUtil.PARTITION_ID_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

    static HEADER_SIZE: number = BitsUtil.DATA_OFFSET_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;

    static calculateSizeData(data: Data) {
        return BitsUtil.INT_SIZE_IN_BYTES + data.totalSize();
    }
    public static getStringSize(value: string, nullable: boolean = false): number {
        // int32 for string length
        var size = 4;

        if (nullable) {
            size += 1;
        }

        size += value == null ? 0 : value.length;

        return size;
    }

    public static calculateSizeString(value: string) {
        return this.getStringSize(value);
    }

    public static calculateSizeBuffer(value: Buffer) {
        var size = 4;
        size += value.length;
        return size;
    }
    public static calculateSizeAddress(value: Address) {
        var size = 4;
        size += this.calculateSizeString(value.host);
        return size;
    }
}
