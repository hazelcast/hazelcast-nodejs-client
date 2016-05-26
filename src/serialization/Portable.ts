import {Serializer, SerializationService} from './SerializationService';
import {DataInput, PositionalDataOutput} from './Data';
import {BitsUtil} from '../BitsUtil';
import {ClassDefinition, FieldType, FieldDefinition} from './ClassDefinition';
import * as Util from '../Util';
import {PortableFactory, Portable, VersionedPortable} from './Serializable';

export class PortableSerializer implements Serializer {

    private portableContext: PortableContext;
    private factories: {[id: number]: PortableFactory};
    private service: SerializationService;

    constructor(service: SerializationService, portableFactories: {[id: number]: PortableFactory}, portableVersion: number) {
        this.service = service;
        this.portableContext = new PortableContext(this.service, portableVersion);
        this.factories = portableFactories;
    }

    getId(): number {
        return -1;
    }

    read(input: DataInput): any {
        var factoryId = input.readInt();
        var classId = input.readInt();
        return this.readObject(input, factoryId, classId);
    }

    readObject(input: DataInput, factoryId: number, classId: number): Portable {
        var version = input.readInt();

        var factory = this.factories[factoryId];
        if (factory == null) {
            throw new RangeError(`There is no suitable portable factory for ${factoryId}.`);
        }

        var portable: Portable = factory.create(classId);
        var classDefinition = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (classDefinition === null) {
            var backupPos = input.position();
            try {
                classDefinition = this.portableContext.readClassDefinitionFromInput(input, factoryId, classId, version);
            } finally {
                input.position(backupPos);
            }
        }
        var reader: PortableReader;
        if (classDefinition.getVersion() === this.portableContext.getClassVersion(portable)) {
            reader = new DefaultPortableReader(this, input, classDefinition);
        } else {
            reader = new MorphingPortableReader(this, input, classDefinition);
        }
        portable.readPortable(reader);
        reader.end();
        return portable;
    }

    write(output: PositionalDataOutput, object: Portable): void {
        output.writeInt(object.getFactoryId());
        output.writeInt(object.getClassId());

        this.writeObject(output, object);
    }

    writeObject(output: PositionalDataOutput, object: Portable): void {
        var cd: ClassDefinition = this.portableContext.lookupOrRegisterClassDefinition(object);

        output.writeInt(cd.getVersion());
        var writer = new DefaultPortableWriter(this, output, cd);
        object.writePortable(writer);
        writer.end();
    }
}

export interface PortableWriter {
    writeInt(fieldName: string, value: number): void;

    writeLong(fieldName: string, long: Long): void;

    writeUTF(fieldName: string, str: string): void;

    writeBoolean(fieldName: string, value: boolean): void;

    writeByte(fieldName: string, value: number): void;

    writeChar(fieldName: string, char: string): void;

    writeDouble(fieldName: string, double: number): void;

    writeFloat(fieldName: string, float: number): void;

    writeShort(fieldName: string, value: number): void;

    writePortable(fieldName: string, portable: Portable): void;

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void;

    writeByteArray(fieldName: string, bytes: number[]): void;

    writeBooleanArray(fieldName: string, booleans: boolean[]): void;

    writeCharArray(fieldName: string, chars: string[]): void;

    writeIntArray(fieldName: string, ints: number[]): void;

    writeLongArray(fieldName: string, longs: Long[]): void;

    writeDoubleArray(fieldName: string, doubles: number[]): void;

    writeFloatArray(fieldName: string, floats: number[]): void;

    writeShortArray(fieldName: string, shorts: number[]): void;

    writeUTFArray(fieldName: string, val: string[]): void;

    writePortableArray(fieldName: string, portables: Portable[]): void;

    end(): void;
}

class DefaultPortableWriter {
    private serializer: PortableSerializer;
    private output: PositionalDataOutput;
    private classDefinition: ClassDefinition;

    private offset: number;
    private begin: number;

    constructor(serializer: PortableSerializer, output: PositionalDataOutput, classDefinition: ClassDefinition) {
        this.serializer = serializer;
        this.output = output;
        this.classDefinition = classDefinition;
        this.begin = this.output.position();

        this.output.writeZeroBytes(4);
        this.output.writeInt(this.classDefinition.getFieldCount());
        this.offset = this.output.position();

        var fieldIndexesLength: number = (this.classDefinition.getFieldCount() + 1) * BitsUtil.INT_SIZE_IN_BYTES;
        this.output.writeZeroBytes(fieldIndexesLength);
    }

    writeInt(fieldName: string, value: number): void {
        this.setPosition(fieldName, FieldType.INT);
        this.output.writeInt(value);
    }

    writeLong(fieldName: string, long: Long): void {
        this.setPosition(fieldName, FieldType.LONG);
        this.output.writeLong(long);
    }

    writeUTF(fieldName: string, str: string): void {
        this.setPosition(fieldName, FieldType.UTF);
        this.output.writeUTF(str);
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.setPosition(fieldName, FieldType.BOOLEAN);
        this.output.writeBoolean(value);
    }

    writeByte(fieldName: string, value: number): void {
        this.setPosition(fieldName, FieldType.BYTE);
        this.output.writeByte(value);
    }

    writeChar(fieldName: string, char: string): void {
        this.setPosition(fieldName, FieldType.CHAR);
        this.output.writeChar(char);
    }

    writeDouble(fieldName: string, double: number): void {
        this.setPosition(fieldName, FieldType.DOUBLE);
        this.output.writeDouble(double);
    }

    writeFloat(fieldName: string, float: number): void {
        this.setPosition(fieldName, FieldType.FLOAT);
        this.output.writeFloat(float);
    }

    writeShort(fieldName: string, value: number): void {
        this.setPosition(fieldName, FieldType.SHORT);
        this.output.writeShort(value);
    }

    writePortable(fieldName: string, portable: Portable): void {
        var fieldDefinition = this.setPosition(fieldName, FieldType.PORTABLE);
        var isNullPortable = (portable == null);
        this.output.writeBoolean(isNullPortable);
        this.output.writeInt(fieldDefinition.getFactoryId());
        this.output.writeInt(fieldDefinition.getClassId());
        if (!isNullPortable) {
            this.serializer.writeObject(this.output, portable);
        }
    }

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void {
        this.setPosition(fieldName, FieldType.PORTABLE);
        this.output.writeBoolean(true);
        this.output.writeInt(factoryId);
        this.output.writeInt(classId);
    }

    writeByteArray(fieldName: string, bytes: number[]): void {
        this.setPosition(fieldName, FieldType.BYTE_ARRAY);
        this.output.writeByteArray(bytes);
    }

    writeBooleanArray(fieldName: string, booleans: boolean[]): void {
        this.setPosition(fieldName, FieldType.BOOLEAN_ARRAY);
        this.output.writeBooleanArray(booleans);
    }

    writeCharArray(fieldName: string, chars: string[]): void {
        this.setPosition(fieldName, FieldType.CHAR_ARRAY);
        this.output.writeCharArray(chars);
    }

    writeIntArray(fieldName: string, ints: number[]): void {
        this.setPosition(fieldName, FieldType.INT_ARRAY);
        this.output.writeIntArray(ints);
    }

    writeLongArray(fieldName: string, longs: Long[]): void {
        this.setPosition(fieldName, FieldType.LONG_ARRAY);
        this.output.writeLongArray(longs);
    }

    writeDoubleArray(fieldName: string, doubles: number[]): void {
        this.setPosition(fieldName, FieldType.DOUBLE_ARRAY);
        this.output.writeDoubleArray(doubles);
    }

    writeFloatArray(fieldName: string, floats: number[]): void {
        this.setPosition(fieldName, FieldType.FLOAT_ARRAY);
        this.output.writeFloatArray(floats);
    }

    writeShortArray(fieldName: string, shorts: number[]): void {
        this.setPosition(fieldName, FieldType.SHORT_ARRAY);
        this.output.writeShortArray(shorts);
    }

    writeUTFArray(fieldName: string, val: string[]): void {
        this.setPosition(fieldName, FieldType.UTF_ARRAY);
        this.output.writeUTFArray(val);
    }

    writePortableArray(fieldName: string, portables: Portable[]): void {
        var innerOffset: number;
        var sample: Portable;
        var i: number;
        var fieldDefinition = this.setPosition(fieldName, FieldType.PORTABLE_ARRAY);
        var len = (portables == null ) ? BitsUtil.NULL_ARRAY_LENGTH : portables.length;
        this.output.writeInt(len);
        this.output.writeInt(fieldDefinition.getFactoryId());
        this.output.writeInt(fieldDefinition.getClassId());
        if (len > 0) {
            innerOffset = this.output.position();
            this.output.writeZeroBytes(len * 4);
            for (i = 0; i < len; i++) {
                sample = portables[i];
                var posVal = this.output.position();
                this.output.pwriteInt(innerOffset + i * BitsUtil.INT_SIZE_IN_BYTES, posVal);
                this.serializer.writeObject(this.output, sample);
            }
        }
    }

    end(): void {
        var position = this.output.position();
        this.output.pwriteInt(this.begin, position);
    }

    private setPosition(fieldName: string, fieldType: FieldType): FieldDefinition {
        var field: FieldDefinition = this.classDefinition.getField(fieldName);
        var pos: number = this.output.position();
        var index: number = field.getIndex();
        this.output.pwriteInt(this.offset + index * BitsUtil.INT_SIZE_IN_BYTES, pos);
        this.output.writeShort(fieldName.length);
        this.output.writeBytes(fieldName);
        this.output.writeByte(fieldType);
        return field;
    }
}

export interface PortableReader {
    getVersion(): number;
    hasField(fieldName: string): boolean;
    getFieldNames(): string[];
    getFieldType(fieldName: string): FieldType;
    readInt(fieldName: string): number;
    readLong(fieldName: string): Long;
    readUTF(fieldName: string): string;
    readBoolean(fieldName: string): boolean;
    readByte(fieldName: string): number;
    readChar(fieldName: string): string;
    readDouble(fieldName: string): number;
    readFloat(fieldName: string): number;
    readShort(fieldName: string): number;
    readPortable(fieldName: string): Portable;
    readByteArray(fieldName: string): number[];
    readBooleanArray(fieldName: string): boolean[];
    readCharArray(fieldName: string): string[];
    readIntArray(fieldName: string): number[];
    readLongArray(fieldName: string): Long[];
    readDoubleArray(fieldName: string): number[];
    readFloatArray(fieldName: string): number[];
    readShortArray(fieldName: string): number[];
    readUTFArray(fieldName: string): string[];
    readPortableArray(fieldName: string): Portable[];
    end(): void;
}

class DefaultPortableReader implements PortableReader {

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

class MorphingPortableReader extends DefaultPortableReader {
    constructor(portableSerializer: PortableSerializer, input: DataInput, classDefinition: ClassDefinition) {
        super(portableSerializer, input, classDefinition);
    }

    private validateCompatibleAndCall(fieldName: string, expectedType: FieldType, superFunc: Function) {
        var fd = this.classDefinition.getField(fieldName);
        if (fd === null) {
            return undefined;
        }
        if (fd.getType() !== expectedType) {
            throw this.createIncompatibleClassChangeError(fd, expectedType);
        }
        return superFunc.call(this, fieldName);
    }

    private createIncompatibleClassChangeError(fd: FieldDefinition, expectedType: FieldType) {
        return new TypeError(`Incompatible to read ${expectedType} from ${fd.getType()} while reading field : ${fd.getName()}`);
    }

    readInt(fieldName: string): number {
        var fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case FieldType.INT: return super.readInt(fieldName);
            case FieldType.BYTE: return super.readByte(fieldName);
            case FieldType.CHAR: return super.readChar(fieldName).charCodeAt(0);
            case FieldType.SHORT: return super.readShort(fieldName);
            default: throw this.createIncompatibleClassChangeError(fieldDef, FieldType.INT);
        }
    }

    readLong(fieldName: string): Long {
        var fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case FieldType.LONG: return super.readLong(fieldName);
            case FieldType.INT: return Long.fromNumber(super.readInt(fieldName));
            case FieldType.BYTE: return Long.fromNumber(super.readByte(fieldName));
            case FieldType.CHAR: return Long.fromNumber(super.readChar(fieldName).charCodeAt(0));
            case FieldType.SHORT: return Long.fromNumber(super.readShort(fieldName));
            default: throw this.createIncompatibleClassChangeError(fieldDef, FieldType.LONG);
        }
    }

    readDouble(fieldName: string): number {
        var fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case FieldType.DOUBLE: return super.readDouble(fieldName);
            case FieldType.LONG: return super.readLong(fieldName).toNumber();
            case FieldType.FLOAT: return super.readFloat(fieldName);
            case FieldType.INT: return super.readInt(fieldName);
            case FieldType.BYTE: return super.readByte(fieldName);
            case FieldType.CHAR: return super.readChar(fieldName).charCodeAt(0);
            case FieldType.SHORT: return super.readShort(fieldName);
            default: throw this.createIncompatibleClassChangeError(fieldDef, FieldType.DOUBLE);
        }
    }

    readFloat(fieldName: string): number {
        var fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case FieldType.FLOAT: return super.readFloat(fieldName);
            case FieldType.INT: return super.readInt(fieldName);
            case FieldType.BYTE: return super.readByte(fieldName);
            case FieldType.CHAR: return super.readChar(fieldName).charCodeAt(0);
            case FieldType.SHORT: return super.readShort(fieldName);
            default: throw this.createIncompatibleClassChangeError(fieldDef, FieldType.FLOAT);
        }
    }

    readShort(fieldName: string): number {
        var fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case FieldType.BYTE: return super.readByte(fieldName);
            case FieldType.SHORT: return super.readShort(fieldName);
            default: throw this.createIncompatibleClassChangeError(fieldDef, FieldType.SHORT);
        }
    }

    readPortableArray(fieldName: string): Portable[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.PORTABLE_ARRAY, super.readPortableArray);
    }

    readUTFArray(fieldName: string): string[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.UTF_ARRAY, super.readUTFArray);
    }

    readShortArray(fieldName: string): number[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.SHORT_ARRAY, super.readShortArray);
    }

    readFloatArray(fieldName: string): number[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.FLOAT_ARRAY, super.readFloatArray);
    }

    readDoubleArray(fieldName: string): number[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.DOUBLE_ARRAY, super.readDoubleArray);
    }

    readLongArray(fieldName: string): Long[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.LONG_ARRAY, super.readLongArray);
    }

    readIntArray(fieldName: string): number[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.INT_ARRAY, super.readIntArray);
    }

    readCharArray(fieldName: string): string[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.CHAR_ARRAY, super.readCharArray);
    }

    readBooleanArray(fieldName: string): boolean[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.BOOLEAN_ARRAY, super.readBooleanArray);
    }

    readByteArray(fieldName: string): number[] {
        return this.validateCompatibleAndCall(fieldName, FieldType.BYTE_ARRAY, super.readByteArray);
    }

    readChar(fieldName: string): string {
        return this.validateCompatibleAndCall(fieldName, FieldType.CHAR, super.readChar);
    }

    readByte(fieldName: string): number {
        return this.validateCompatibleAndCall(fieldName, FieldType.BYTE, super.readByte);
    }

    readBoolean(fieldName: string): boolean {
        return this.validateCompatibleAndCall(fieldName, FieldType.BOOLEAN, super.readBoolean);
    }

    readUTF(fieldName: string): string {
        return this.validateCompatibleAndCall(fieldName, FieldType.UTF, super.readUTF);
    }
}

export class PortableContext {
    private service: SerializationService;
    private portableVersion: number = 0;
    private classDefContext: {[factoyId: number]: ClassDefinitionContext};

    constructor(service: SerializationService, portableVersion: number) {
        this.service = service;
        this.portableVersion = portableVersion;
        this.classDefContext = {};
    }

    getVersion(): number {
        return this.portableVersion;
    }

    readClassDefinitionFromInput(input: DataInput, factoryId: number, classId: number, version: number): ClassDefinition {
        var register = true;
        var cdWriter = new ClassDefinitionWriter(this, factoryId, classId, version);
        input.readInt();

        var fieldCount = input.readInt();
        var offset = input.position();
        for (var i = 0; i < fieldCount; i++) {
            var pos = input.readInt(offset + i * BitsUtil.INT_SIZE_IN_BYTES);
            input.position(pos);

            var len = input.readShort();
            var chars = '';
            for (var j = 0; j < len; j++) {
                chars += String.fromCharCode(input.readUnsignedByte());
            }

            var type: FieldType = input.readByte();
            var name = chars;
            var fieldFactoryId = 0;
            var fieldClassId = 0;
            if (type === FieldType.PORTABLE) {
                //is null
                if (input.readBoolean()) {
                    register = false;
                }
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what there's a null inner Portable field
                if (register) {
                    var fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                }
            } else if (type === FieldType.PORTABLE_ARRAY) {
                var k = input.readInt();
                fieldFactoryId = input.readInt();
                fieldClassId = input.readInt();

                // TODO: what there's a null inner Portable field
                if (k > 0) {
                    var p = input.readInt();
                    input.position(p);
                    var fieldVersion = input.readInt();
                    this.readClassDefinitionFromInput(input, fieldFactoryId, fieldClassId, fieldVersion);
                } else {
                    register = false;
                }
            }
            cdWriter.addFieldByType(name, type, fieldFactoryId, fieldClassId);
        }
        cdWriter.end();
        var classDefinition = cdWriter.getDefinition();
        if (register) {
            classDefinition = cdWriter.registerAndGet();
        }
        return classDefinition;
    }

    lookupOrRegisterClassDefinition(portable: Portable): ClassDefinition {
        var version = this.getClassVersion(portable);
        var definition = this.lookupClassDefinition(portable.getFactoryId(), portable.getClassId(), version);
        if (definition === null) {
            definition = this.generateClassDefinitionForPortable(portable);
            this.registerClassDefinition(definition);
        }
        return definition;
    }

    lookupClassDefinition(factoryId: number, classId: number, version: number): ClassDefinition {
        var factory = this.classDefContext[factoryId];
        if (factory == null) {
            return null;
        } else {
            return factory.lookup(classId, version);
        }
    }

    generateClassDefinitionForPortable(portable: Portable): ClassDefinition {
        var version: number = this.getClassVersion(portable);
        var classDefinitionWriter = new ClassDefinitionWriter(this, portable.getFactoryId(), portable.getClassId(), version);
        portable.writePortable(classDefinitionWriter);
        classDefinitionWriter.end();
        return classDefinitionWriter.registerAndGet();
    }

    registerClassDefinition(classDefinition: ClassDefinition): ClassDefinition {
        var factoryId = classDefinition.getFactoryId();
        var classId = classDefinition.getClassId();
        var version = classDefinition.getVersion();
        if (!this.classDefContext[factoryId]) {
            this.classDefContext[factoryId] = new ClassDefinitionContext(factoryId, this.portableVersion);
        }
        return this.classDefContext[factoryId].register(classDefinition);
    }

    getClassVersion(portable: VersionedPortable | Portable): number {
        if ((<VersionedPortable>portable).getVersion) {
            return (<VersionedPortable>portable).getVersion();
        } else {
            return this.portableVersion;
        }
    }

}

export class ClassDefinitionContext {
    private factoryId: number;

    private classDefs: {[classId: string]: ClassDefinition};

    constructor(factoryId: number, portableVersion: number) {
        this.factoryId = factoryId;
        this.classDefs = {};
    }

    private static encodeVersionedClassId(classId: number, version: number): string {
        return classId + 'v' + version;
    }

    private static decodeVersionedClassId(encoded: string): [number, number] {
        var re = /(\d+)v(\d+)/;
        var extracted = re.exec(encoded);
        return [Number.parseInt(extracted[1]), Number.parseInt(extracted[2])];
    }

    lookup(classId: number, version: number) {
        var encoded = ClassDefinitionContext.encodeVersionedClassId(classId, version);
        return this.classDefs[encoded];
    }

    register(classDefinition: ClassDefinition): ClassDefinition {
        if (classDefinition === null) {
            return null;
        }
        if (classDefinition.getFactoryId() !== this.factoryId) {
            throw new RangeError(`This factory's number is ${this.factoryId}. 
            Intended factory id is ${classDefinition.getFactoryId()}`);
        }
        var cdKey = ClassDefinitionContext.encodeVersionedClassId(classDefinition.getClassId(), classDefinition.getVersion());
        var current = this.classDefs[cdKey];
        if (current == null) {
            this.classDefs[cdKey] = classDefinition;
            return classDefinition;
        }
        if (current instanceof ClassDefinition && !current.equals(classDefinition)) {
            throw new RangeError(`Incompatible class definition with same class id: ${classDefinition.getClassId()}`);
        }
        return classDefinition;
    }
}

class ClassDefinitionWriter implements PortableWriter {
    private portableContext: PortableContext;
    private buildingDefinition: ClassDefinition;

    private index: number = 0;
    private factoryId: number;
    private classId: number;
    private version: number;
    private fieldDefinitions: {[fieldName: string]: FieldDefinition} = {};

    constructor(portableContext: PortableContext, factoryId: number, classId: number, version: number) {
        this.portableContext = portableContext;
        this.buildingDefinition = new ClassDefinition(factoryId, classId, version);
    }

    addFieldByType(fieldName: string, fieldType: FieldType, factoryId: number = 0, classId: number = 0) {
        this.fieldDefinitions[fieldName] = new FieldDefinition(this.index, fieldName, fieldType, factoryId, classId);
        this.index += 1;
    }

    writeInt(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.INT);
    }

    writeLong(fieldName: string, long: Long): void {
        this.addFieldByType(fieldName, FieldType.LONG);
    }

    writeUTF(fieldName: string, str: string): void {
        this.addFieldByType(fieldName, FieldType.UTF);
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.addFieldByType(fieldName, FieldType.BOOLEAN);
    }

    writeByte(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.BYTE);
    }

    writeChar(fieldName: string, char: string): void {
        this.addFieldByType(fieldName, FieldType.CHAR);
    }

    writeDouble(fieldName: string, double: number): void {
        this.addFieldByType(fieldName, FieldType.DOUBLE);
    }

    writeFloat(fieldName: string, float: number): void {
        this.addFieldByType(fieldName, FieldType.FLOAT);
    }

    writeShort(fieldName: string, value: number): void {
        this.addFieldByType(fieldName, FieldType.SHORT);
    }

    writePortable(fieldName: string, portable: Portable): void {
        Util.assertNotNull(portable);
        var nestedCD = this.portableContext.lookupOrRegisterClassDefinition(portable);
        this.addFieldByType(fieldName, FieldType.PORTABLE, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void {
        var version: number = 0;
        var nestedCD = this.portableContext.lookupClassDefinition(factoryId, classId, version);
        if (nestedCD === null) {
            throw new RangeError('Cannot write null portable without explicitly registering class definition!');
        }
        this.addFieldByType(fieldName, FieldType.PORTABLE, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    writeByteArray(fieldName: string, bytes: number[]): void {
        this.addFieldByType(fieldName, FieldType.BYTE_ARRAY);
    }

    writeBooleanArray(fieldName: string, booleans: boolean[]): void {
        this.addFieldByType(fieldName, FieldType.BOOLEAN_ARRAY);
    }

    writeCharArray(fieldName: string, chars: string[]): void {
        this.addFieldByType(fieldName, FieldType.CHAR_ARRAY);
    }

    writeIntArray(fieldName: string, ints: number[]): void {
        this.addFieldByType(fieldName, FieldType.INT_ARRAY);
    }

    writeLongArray(fieldName: string, longs: Long[]): void {
        this.addFieldByType(fieldName, FieldType.LONG_ARRAY);
    }

    writeDoubleArray(fieldName: string, doubles: number[]): void {
        this.addFieldByType(fieldName, FieldType.DOUBLE_ARRAY);
    }

    writeFloatArray(fieldName: string, floats: number[]): void {
        this.addFieldByType(fieldName, FieldType.FLOAT_ARRAY);
    }

    writeShortArray(fieldName: string, shorts: number[]): void {
        this.addFieldByType(fieldName, FieldType.SHORT_ARRAY);
    }

    writeUTFArray(fieldName: string, val: string[]): void {
        this.addFieldByType(fieldName, FieldType.UTF_ARRAY);
    }

    writePortableArray(fieldName: string, portables: Portable[]): void {
        Util.assertNotNull(portables);
        if (portables.length === 0) {
            throw new RangeError('Cannot write empty array!');
        }
        var sample = portables[0];
        var nestedCD = this.portableContext.lookupOrRegisterClassDefinition(sample);
        this.addFieldByType(fieldName, FieldType.PORTABLE_ARRAY, nestedCD.getFactoryId(), nestedCD.getClassId());
    }

    end(): void {
        for (var field in this.fieldDefinitions) {
            this.buildingDefinition.addFieldDefinition(this.fieldDefinitions[field]);
        }
    }

    getDefinition(): ClassDefinition {
        return this.buildingDefinition;
    }

    registerAndGet(): ClassDefinition {
        return this.portableContext.registerClassDefinition(this.buildingDefinition);
    }
}
