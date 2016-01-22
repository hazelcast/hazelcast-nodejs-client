/* tslint:disable:no-bitwise */
export class BitsUtil {
    static BYTE_SIZE_IN_BYTES : number = 1;
    static BOOLEAN_SIZE_IN_BYTES : number = 1;
    static SHORT_SIZE_IN_BYTES : number = 2;
    static CHAR_SIZE_IN_BYTES : number = 2;
    static INT_SIZE_IN_BYTES : number = 4;
    static FLOAT_SIZE_IN_BYTES : number = 4;
    static LONG_SIZE_IN_BYTES : number = 8;
    static DOUBLE_SIZE_IN_BYTES : number = 8;

    static  BIG_ENDIAN : number = 2;
    static LITTLE_ENDIAN : number = 1;

    static VERSION : number = 1;
    static BEGIN_FLAG : number = 0x80;
    static END_FLAG : number = 0x40;
    static BEGIN_END_FLAG : number = BitsUtil.BEGIN_FLAG | BitsUtil.END_FLAG;
    static LISTENER_FLAG : number = 0x01;

    static SIZE_OFFSET : number = 0;

    static FRAME_LENGTH_FIELD_OFFSET : number = 0;
    static VERSION_FIELD_OFFSET : number = BitsUtil.FRAME_LENGTH_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
    static FLAGS_FIELD_OFFSET : number = BitsUtil.VERSION_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static TYPE_FIELD_OFFSET : number = BitsUtil.FLAGS_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static CORRELATION_ID_FIELD_OFFSET : number = BitsUtil.TYPE_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
    static PARTITION_ID_FIELD_OFFSET : number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    static DATA_OFFSET_FIELD_OFFSET : number = BitsUtil.PARTITION_ID_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

    static HEADER_SIZE : number = BitsUtil.DATA_OFFSET_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
}
