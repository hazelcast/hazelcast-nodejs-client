import {PortableReader, PortableSerializer} from './PortableSerializer';
import {DataInput} from '../Data';
import {ClassDefinition, FieldDefinition, FieldType} from './ClassDefinition';
import {BitsUtil} from '../../BitsUtil';
import {Portable} from '../Serializable';
export class DefaultPortableReader implements PortableReader {

    protected serializer: PortableSerializer;
    protected input: DataInput;
    protected classDefinition: ClassDefinition;

    private offset: number;
    private finalPos: number;

    constructor(serializer: PortableSerializer, input: DataInput, classDefinition: ClassDefinition) {
        this.serializer = serializer;
        this.input = input;
        this.classDefinition = classDefinition;

        this.finalPos = this.input.readInt();
        var fieldCount = this.input.readInt();
        this.offset = this.input.position();
    }

    private positionByFieldDefinition(field: FieldDefinition): number {
        var pos = this.input.readInt(this.offset + field.getIndex() * BitsUtil.INT_SIZE_IN_BYTES);
        var len = this.input.readShort(pos);
        return pos + BitsUtil.SHORT_SIZE_IN_BYTES + len + 1;
    }

    private positionByField(fieldName: string, fieldType: FieldType): number {
        var definition = this.classDefinition.getField(fieldName);
        return this.positionByFieldDefinition(definition);
    }

    getVersion(): number {
        return this.classDefinition.getVersion();
    }

    hasField(fieldName: string): boolean {
        return this.classDefinition.hasField(fieldName);
    }

    getFieldNames(): string[] {
        throw new Error('Not implemented!');
    }

    getFieldType(fieldName: string): FieldType {
        return this.classDefinition.getFieldType(fieldName);
    }

    readInt(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.INT);
        return this.input.readInt(pos);
    }

    readLong(fieldName: string): Long {
        var pos = this.positionByField(fieldName, FieldType.LONG);
        return this.input.readLong(pos);
    }

    readUTF(fieldName: string): string {
        var pos = this.positionByField(fieldName, FieldType.UTF);
        return this.input.readUTF(pos);
    }

    readBoolean(fieldName: string): boolean {
        var pos = this.positionByField(fieldName, FieldType.BOOLEAN);
        return this.input.readBoolean(pos);
    }

    readByte(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.BYTE);
        return this.input.readByte(pos);
    }

    readChar(fieldName: string): string {
        var pos = this.positionByField(fieldName, FieldType.CHAR);
        return this.input.readChar(pos);
    }

    readDouble(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.DOUBLE);
        return this.input.readDouble(pos);
    }

    readFloat(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.FLOAT);
        return this.input.readFloat(pos);
    }

    readShort(fieldName: string): number {
        var pos = this.positionByField(fieldName, FieldType.SHORT);
        return this.input.readShort(pos);
    }

    readPortable(fieldName: string): Portable {
        var backupPos = this.input.position();
        try {
            var pos = this.positionByField(fieldName, FieldType.PORTABLE);
            this.input.position(pos);
            var isNull = this.input.readBoolean();
            var factoryId = this.input.readInt();
            var classId = this.input.readInt();
            if (isNull) {
                return null;
            } else {
                return this.serializer.readObject(this.input, factoryId, classId);
            }
        } finally {
            this.input.position(backupPos);
        }
    }

    readByteArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.BYTE_ARRAY);
        return this.input.readByteArray(pos);
    }

    readBooleanArray(fieldName: string): boolean[] {
        var pos = this.positionByField(fieldName, FieldType.BOOLEAN_ARRAY);
        return this.input.readBooleanArray(pos);
    }

    readCharArray(fieldName: string): string[] {
        var pos = this.positionByField(fieldName, FieldType.CHAR_ARRAY);
        return this.input.readCharArray(pos);
    }

    readIntArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.INT_ARRAY);
        return this.input.readIntArray(pos);
    }

    readLongArray(fieldName: string): Long[] {
        var pos = this.positionByField(fieldName, FieldType.LONG_ARRAY);
        return this.input.readLongArray(pos);
    }

    readDoubleArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.DOUBLE_ARRAY);
        return this.input.readDoubleArray(pos);
    }

    readFloatArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.FLOAT_ARRAY);
        return this.input.readFloatArray(pos);
    }

    readShortArray(fieldName: string): number[] {
        var pos = this.positionByField(fieldName, FieldType.SHORT_ARRAY);
        return this.input.readShortArray(pos);
    }

    readUTFArray(fieldName: string): string[] {
        var pos = this.positionByField(fieldName, FieldType.UTF_ARRAY);
        return this.input.readUTFArray(pos);
    }

    readPortableArray(fieldName: string): Portable[] {
        var backupPos = this.input.position();
        try {
            var pos = this.positionByField(fieldName, FieldType.PORTABLE_ARRAY);
            this.input.position(pos);
            var len = this.input.readInt();
            var factoryId = this.input.readInt();
            var classId = this.input.readInt();
            if (len === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            } else {
                var portables: Portable[] = [];
                if (len > 0) {
                    var offset = this.input.position();
                    for (var i = 0; i < len; i++) {
                        var start = this.input.readInt(offset + i * BitsUtil.INT_SIZE_IN_BYTES);
                        this.input.position(start);
                        portables[i] = this.serializer.readObject(this.input, factoryId, classId);
                    }
                }
                return portables;
            }
        } finally {
            this.input.position(backupPos);
        }
    }

    end() {
        //EMPTY METHOD
    }
}
