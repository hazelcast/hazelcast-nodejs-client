import {Data, DataOutput, DataInput} from './Data';
import {HeapData, DATA_OFFSET} from './HeapData';
import {SerializationConfig} from '../Config';
import {ObjectDataOutput, ObjectDataInput} from './ObjectData';
import {
    StringSerializer, BooleanSerializer, DoubleSerializer, NullSerializer,
    ShortSerializer, IntegerSerializer, LongSerializer, FloatSerializer, BooleanArraySerializer, ShortArraySerializer,
    IntegerArraySerializer, LongArraySerializer, DoubleArraySerializer, StringArraySerializer
} from './DefaultSerializer';
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
        //TODO
    }

    readObject(inp: DataInput): any {
        return null;
    }
}

export class SerializationServiceV1 implements SerializationService{

    private registry: {[id: number]: Serializer};
    private serializerNameToId: {[name: string]: number};
    private numberType: string;
    private serialiationConfig: SerializationConfig;

    constructor(serializationConfig: SerializationConfig) {
        this.serialiationConfig = serializationConfig;
        this.registry = {};
        this.serializerNameToId = {};
        this.registerDefaultSerializers();
    }

    private defaultPartitionStrategy(obj: any): number {
        /* tslint:disable:no-string-literal */
        if (obj['getPartitionHash']) {
            /* tslint:enable:no-string-literal */
            return obj.getPartitionHash();
        } else {
            return 0;
        }
    }

    protected registerDefaultSerializers() {
        this.registerSerializer('string', new StringSerializer());
        this.registerSerializer('number', new DoubleSerializer());
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
        this.registerSerializer('numberArray', new DoubleArraySerializer());
        this.registerSerializer('stringArray', new StringArraySerializer());
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
        //TODO
    }

    readObject(inp: DataInput): any {
        //TODO
        return null;
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

    findSerializerFor(obj: any): Serializer {
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return this.findSerializerByName('number', true);
            } else {
                return this.findSerializerByName(typeof obj[0], true);
            }
        } else {
            return this.findSerializerByName(typeof obj, false);
        }
    }

    protected findSerializerByName(name: string, isArray: boolean): Serializer {
        var serializerName = name + (isArray ? 'Array' : '');
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
