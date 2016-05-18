import {Data, DataOutput, DataInput} from './Data';
import {HeapData, DATA_OFFSET} from './HeapData';
import {SerializationConfig} from '../Config';
import {ObjectDataOutput, ObjectDataInput} from './ObjectData';
import {
    StringSerializer, BooleanSerializer, DoubleSerializer, NullSerializer,
    ShortSerializer, IntegerSerializer, LongSerializer, FloatSerializer, BooleanArraySerializer, ShortArraySerializer,
    IntegerArraySerializer, LongArraySerializer, DoubleArraySerializer, StringArraySerializer,
    IdentifiedDataSerializableSerializer, FloatArraySerializer
} from './DefaultSerializer';
import * as Util from '../Util';
import {IdentifiedDataSerializable} from './Serializable';
export interface SerializationService {
    toData(object: any, paritioningStrategy?: any) : Data;

    toObject(data: Data) : any;

    writeObject(out: DataOutput, object: any): void;

    readObject(inp: DataInput): any;
}

export interface Serializer {
    getId(): number;
    read(input: DataInput): any;
    write(output: DataOutput, object: any): void;
}

export class JsonSerializationService implements SerializationService {
    toData(object: any): Data {
        var jsonString: string = JSON.stringify(object);
        var buffer = new Buffer(12 + Buffer.byteLength(jsonString, 'utf8'));
        buffer.writeInt32BE(0, 0); // partition hash
        buffer.writeInt32BE(-11, 4); //string serializer
        buffer.writeInt32BE(jsonString.length, 8);
        buffer.write(jsonString, 12);

        return new HeapData(buffer);
    }

    toObject(data: Data): any {
        if (data == null) {
            return null;
        }
        return JSON.parse(data.toBuffer().toString('utf8', 12));
    }

    writeObject(out: DataOutput, object: any): void {
        throw new Error('This method is not applicable in JSON serialization context');
    }

    readObject(inp: DataInput): any {
        throw new Error('This method is not applicable in JSON serialization context');
    }
}

export class SerializationServiceV1 implements SerializationService {

    private registry: {[id: number]: Serializer};
    private serializerNameToId: {[name: string]: number};
    private numberType: string;
    private serialiationConfig: SerializationConfig;

    constructor(serializationConfig: SerializationConfig) {
        this.serialiationConfig = serializationConfig;
        this.registry = {};
        this.serializerNameToId = {};
        this.registerDefaultSerializers();
        this.registerCustomSerializers(serializationConfig.customSerializers);
        this.registerGlobalSerializer(serializationConfig.globalSerializer);
    }

    toData(object: any, partitioningStrategy: any = this.defaultPartitionStrategy): Data {
        var dataOutput: DataOutput = new ObjectDataOutput(1, this, this.serialiationConfig.isBigEndian);
        var serializer = this.findSerializerFor(object);
        dataOutput.writeIntBE(this.calculatePartitionHash(object, partitioningStrategy));
        dataOutput.writeIntBE(serializer.getId());
        serializer.write(dataOutput, object);
        return new HeapData(dataOutput.toBuffer());
    }

    toObject(data: Data): any {
        var serializer = this.findSerializerById(data.getType());
        var dataInput = new ObjectDataInput(data.toBuffer(), DATA_OFFSET, this, this.serialiationConfig.isBigEndian);
        return serializer.read(dataInput);
    }

    writeObject(out: DataOutput, object: any): void {
        var serializer = this.findSerializerFor(object);
        out.writeInt(serializer.getId());
        serializer.write(out, object);
    }

    readObject(inp: DataInput): any {
        var serializerId = inp.readInt();
        var serializer = this.findSerializerById(serializerId);
        return serializer.read(inp);
    }

    registerSerializer(name: string, serializer: Serializer): void {
        if (this.serializerNameToId[name] ) {
            throw new RangeError('Given serializer name is already in the registry.');
        }
        if (this.registry[serializer.getId()]) {
            throw new RangeError('Given serializer id is already in the registry.');
        }
        this.serializerNameToId[name] = serializer.getId();
        this.registry[serializer.getId()] = serializer;
    }

    /**
     * Serialization precedence
     *  1. NULL
     *  2. DataSerializable
     *  3. Portable
     *  4. Default Types
     *      * Byte, Boolean, Character, Short, Integer, Long, Float, Double, String
     *      * Array of [Byte, Boolean, Character, Short, Integer, Long, Float, Double, String]
     *      * Java types [Date, BigInteger, BigDecimal, Class, Enum]
     *  5. Custom serializers
     *  6. Global Serializer
     *  7. Fallback (JSON)
     * @param obj
     * @returns
     */
    findSerializerFor(obj: any): Serializer {
        if (obj === undefined) {
            throw new RangeError('undefined cannot be serialized.');
        }
        var serializer: Serializer = null;
        if (obj === null) {
            serializer = this.findSerializerByName('null', false);
        }
        if (serializer === null) {
            serializer = this.lookupDefaultSerializer(obj);
        }
        if (serializer === null) {
            serializer = this.lookupCustomSerializer(obj);
        }
        if (serializer === null) {
            serializer = this.lookupGlobalSerializer();
        }
        if (serializer === null) {
            throw new RangeError('There is no suitable serializer for ' + obj + '.');
        }
        return serializer;

    }

    private defaultPartitionStrategy(obj: any): number {
        /* tslint:disable:no-string-literal */
        if (obj == null || !obj['getPartitionHash']) {
            /* tslint:enable:no-string-literal */
            return 0;
        } else {
            return obj.getPartitionHash();
        }
    }

    protected lookupDefaultSerializer(obj: any): Serializer {
        var serializer: Serializer = null;
        if (this.isIdentifiedDataSerializable(obj)) {
            return this.findSerializerByName('identified', false);
        }
        //Look up for Portable
        var objectType = Util.getType(obj);
        if (objectType === 'array') {
            if (obj.length === 0) {
                serializer = this.findSerializerByName('number', true);
            } else {
                serializer = this.findSerializerByName(Util.getType(obj[0]), true);
            }
        } else {
            serializer = this.findSerializerByName(objectType, false);
        }
        return serializer;
    }

    protected lookupCustomSerializer(obj: any): Serializer {
        if (this.isCustomSerializable(obj)) {
            return this.findSerializerById(obj.hzGetCustomId());
        }
        return null;
    }

    protected lookupGlobalSerializer(): Serializer {
        return this.findSerializerByName('!global', false);
    }

    protected isIdentifiedDataSerializable(obj: any): boolean {
        return ( obj.readData && obj.writeData && obj.getClassId && obj.getFactoryId);
    }

    protected registerDefaultSerializers() {
        this.registerSerializer('string', new StringSerializer());
        this.registerSerializer('double', new DoubleSerializer());
        this.registerSerializer('boolean', new BooleanSerializer());
        this.registerSerializer('null', new NullSerializer());
        this.registerSerializer('short', new ShortSerializer());
        this.registerSerializer('integer', new IntegerSerializer());
        this.registerSerializer('long', new LongSerializer());
        this.registerSerializer('float', new FloatSerializer());
        this.registerSerializer('booleanArray', new BooleanArraySerializer());
        this.registerSerializer('shortArray', new ShortArraySerializer());
        this.registerSerializer('integerArray', new IntegerArraySerializer());
        this.registerSerializer('longArray', new LongArraySerializer());
        this.registerSerializer('doubleArray', new DoubleArraySerializer());
        this.registerSerializer('stringArray', new StringArraySerializer());
        this.registerSerializer('floatArray', new FloatArraySerializer());
        this.registerSerializer(
            'identified', new IdentifiedDataSerializableSerializer(this.serialiationConfig.dataSerializableFactories)
        );
    }

    protected registerCustomSerializers(cutomSerializersArray: any[]) {
        var self = this;
        cutomSerializersArray.forEach(function(candidate) {
            self.assertValidCustomSerializer(candidate);
            self.registerSerializer('!custom' + candidate.getId(), candidate);
        });
    }

    protected registerGlobalSerializer(candidate: any) {
        if (candidate == null) {
            return;
        }
        this.assertValidCustomSerializer(candidate);
        this.registerSerializer('!global', candidate);
    }

    protected assertValidCustomSerializer(candidate: any) {
        var fGetId = 'getId';
        var fRead = 'read';
        var fWrite = 'write';
        if (
            typeof candidate[fGetId] !== 'function' ||
            typeof candidate[fRead] !== 'function' ||
            typeof candidate[fWrite] !== 'function'
        ) {
            throw new TypeError('Custom serializer should have ' + fGetId + ', ' + fRead + ' and ' + fWrite + ' methods.');
        }
        var typeId = candidate[fGetId]();
        if (!Number.isInteger(typeId) || typeId < 1) {
            throw new TypeError('Custom serializer should have its typeId greater than or equal to 1.');
        }
    }

    protected isCustomSerializable(object: any) {
        var prop = 'hzGetCustomId';
        return (object[prop] && typeof object[prop] === 'function' && object[prop]() >= 1);
    }

    protected findSerializerByName(name: string, isArray: boolean): Serializer {
        var convertedName: string;
        if (name === 'number') {
            convertedName = this.serialiationConfig.defaultNumberType;
        } else {
            convertedName = name;
        }
        var serializerName = convertedName + (isArray ? 'Array' : '');
        var serializerId = this.serializerNameToId[serializerName];
        if (serializerId == null) {
            return null;
        }
        return this.findSerializerById(serializerId);
    }

    protected findSerializerById(id: number): Serializer {
        var serializer = this.registry[id];
        return serializer;
    }

    protected calculatePartitionHash(object: any, strategy: Function): number {
        return strategy(object);
    }
}
