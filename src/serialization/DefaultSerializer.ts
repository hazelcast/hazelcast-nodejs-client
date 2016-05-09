import {Serializer} from './SerializationService';
import {DataInput, DataOutput} from './Data';
import isPending = Q.isPending;
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
