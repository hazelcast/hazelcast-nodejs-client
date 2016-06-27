import {Serializer} from './SerializationService';
import {DataInput, DataOutput} from './Data';
import {IdentifiedDataSerializableFactory, IdentifiedDataSerializable} from './Serializable';
import Long = require('long');
import {BitsUtil} from '../BitsUtil';
export class StringSerializer implements Serializer {

    getId(): number {
        return -11;
    }

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

export class DoubleSerializer implements Serializer {

    getId(): number {
        return -10;
    }

    read(input: DataInput): any {
        return input.readDouble();
    }

    write(output: DataOutput, object: any): void {
        output.writeDouble(object);
    }
}

export class BooleanSerializer implements Serializer {

    getId(): number {
        return -4;
    }

    read(input: DataInput): any {
        return input.readBoolean();
    }

    write(output: DataOutput, object: any): void {
        output.writeBoolean(object);
    }
}

export class NullSerializer implements Serializer {

    getId(): number {
        return 0;
    }

    read(input: DataInput): any {
        return null;
    }

    write(output: DataOutput, object: any): void {
        //Empty method
    }
}

export class ShortSerializer implements Serializer {

    getId(): number {
        return -6;
    }

    read(input: DataInput): any {
        return input.readShort();
    }

    write(output: DataOutput, object: any): void {
        output.writeShort(object);
    }
}

export class IntegerSerializer implements Serializer {

    getId(): number {
        return -7;
    }

    read(input: DataInput): any {
        return input.readInt();
    }

    write(output: DataOutput, object: any): void {
        output.writeInt(object);
    }
}

export class LongSerializer implements Serializer {

    getId(): number {
        return -8;
    }

    read(input: DataInput): any {
        return input.readLong();
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(object);
    }
}

export class FloatSerializer implements Serializer {

    getId(): number {
        return -9;
    }

    read(input: DataInput): any {
        return input.readFloat();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloat(object);
    }
}

export class DateSerializer implements Serializer {

    getId(): number {
        return -22;
    }

    read(input: DataInput): any {
        return new Date(input.readLong().toNumber());
    }

    write(output: DataOutput, object: any): void {
        output.writeLong(Long.fromNumber(object.getMilliseconds()));
    }
}

export class BooleanArraySerializer implements Serializer {

    getId(): number {
        return -13;
    }

    read(input: DataInput): any {
        return input.readBooleanArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeBooleanArray(object);
    }
}

export class ShortArraySerializer implements Serializer {

    getId(): number {
        return -15;
    }

    read(input: DataInput): any {
        return input.readShortArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeShortArray(object);
    }
}

export class IntegerArraySerializer implements Serializer {

    getId(): number {
        return -16;
    }

    read(input: DataInput): any {
        return input.readIntArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeIntArray(object);
    }
}

export class LongArraySerializer implements Serializer {

    getId(): number {
        return -17;
    }

    read(input: DataInput): any {
        return input.readLongArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeLongArray(object);
    }
}

export class DoubleArraySerializer implements Serializer {

    getId(): number {
        return -19;
    }

    read(input: DataInput): any {
        return input.readDoubleArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeDoubleArray(object);
    }
}

export class StringArraySerializer implements Serializer {

    getId(): number {
        return -20;
    }

    read(input: DataInput): any {
        return input.readUTFArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTFArray(object);
    }
}

export class ByteSerializer implements Serializer {

    getId(): number {
        return -3;
    }

    read(input: DataInput): any {
        return input.readByte();
    }

    write(output: DataOutput, object: any): void {
        output.writeByte(object);
    }
}

export class ByteArraySerializer implements Serializer {

    getId(): number {
        return -12;
    }

    read(input: DataInput): any {
        return input.readByteArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeByteArray(object);
    }
}

export class CharSerializer implements Serializer {

    getId(): number {
        return -5;
    }

    read(input: DataInput): any {
        return input.readChar();
    }

    write(output: DataOutput, object: any): void {
        output.writeChar(object);
    }
}

export class CharArraySerializer implements Serializer {

    getId(): number {
        return -14;
    }

    read(input: DataInput): any {
        return input.readCharArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeCharArray(object);
    }
}

export class FloatArraySerializer implements Serializer {
    getId(): number {
        return -18;
    }

    read(input: DataInput): any {
        return input.readFloatArray();
    }

    write(output: DataOutput, object: any): void {
        output.writeFloatArray(object);
    }
}

export class JavaClassSerializer implements Serializer {

    getId(): number {
        return -21;
    }

    read(input: DataInput): any {
        return input.readUTF();
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(object);
    }
}

export class LinkedListSerializer implements Serializer {

    getId(): number {
        return -27;
    }

    read(input: DataInput): any {
        var size = input.readInt();
        var result: any = null;
        if (size > BitsUtil.NULL_ARRAY_LENGTH) {
            result = [];
            for (var i = 0; i < size; i++) {
                result.push(input.readObject());
            }
        }
        return result;
    }

    write(output: DataOutput, object: any): void {
        //NULL method
    }
}

export class ArrayListSerializer extends LinkedListSerializer {
    getId(): number {
        return -26;
    }
}

export class IdentifiedDataSerializableSerializer implements Serializer {
    private factories: {[id: number]: IdentifiedDataSerializableFactory};
    constructor(factories: {[id: number]: IdentifiedDataSerializableFactory}) {
        this.factories = factories;
    }

    getId(): number {
        return -2;
    }

    read(input: DataInput): any {
        var isIdentified = input.readBoolean();
        if (!isIdentified) {
            throw new RangeError('Native clients does not support Data Serializable. Please use Identified Data Serializable');
        }
        var factoryId = input.readInt();
        var classId = input.readInt();
        var factory: IdentifiedDataSerializableFactory;
        factory = this.factories[factoryId];
        if (!factory) {
            throw new ReferenceError('There is no Identified Data Serializer factory with id ' + factoryId + '.');
        }
        var object = factory.create(classId);
        object.readData(input);
        return object;
    }

    write(output: DataOutput, object: IdentifiedDataSerializable): void {
        output.writeBoolean(true);
        output.writeInt(object.getFactoryId());
        output.writeInt(object.getClassId());
        object.writeData(output);
    }
}

export class JsonSerializer implements Serializer {
    getId(): number {
        return -130;
    }

    read(input: DataInput): any {
        return JSON.parse(input.readUTF());
    }

    write(output: DataOutput, object: any): void {
        output.writeUTF(JSON.stringify(object));
    }
}
