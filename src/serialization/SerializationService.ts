/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @ignore *//** */

import {AGGREGATOR_FACTORY_ID} from '../aggregation/AggregatorConstants';
import {aggregatorFactory} from '../aggregation/Aggregator';
import {CLUSTER_DATA_FACTORY_ID, clusterDataFactory} from './ClusterDataFactory';
import {SerializationConfigImpl} from '../config/SerializationConfig';
import {
    RELIABLE_TOPIC_MESSAGE_FACTORY_ID,
    reliableTopicMessageFactory,
} from '../proxy/topic/ReliableTopicMessage';
import * as Util from '../util/Util';
import {Data, DataInput, DataOutput} from './Data';
import {Serializer, IdentifiedDataSerializableFactory, AsyncSerializer} from './Serializable';
import {
    ArrayListSerializer,
    BigDecimalSerializer,
    BigIntSerializer,
    BooleanArraySerializer,
    BooleanSerializer,
    ByteArraySerializer,
    ByteSerializer,
    CharArraySerializer,
    CharSerializer,
    DateSerializer,
    DoubleArraySerializer,
    DoubleSerializer,
    FloatArraySerializer,
    FloatSerializer,
    HazelcastJsonValueSerializer,
    IdentifiedDataSerializableSerializer,
    IntegerArraySerializer,
    IntegerSerializer,
    JavaClassSerializer,
    JsonSerializer,
    LinkedListSerializer,
    LocalDateSerializer,
    LocalDateTimeSerializer,
    LocalTimeSerializer,
    LongArraySerializer,
    LongSerializer,
    NullSerializer,
    OffsetDateTimeSerializer,
    ShortArraySerializer,
    ShortSerializer,
    StringArraySerializer,
    StringSerializer,
    UuidSerializer
} from './DefaultSerializers';
import {DATA_OFFSET, HeapData} from './HeapData';
import {ObjectDataInput, PositionalObjectDataOutput} from './ObjectData';
import {PortableSerializer} from './portable/PortableSerializer';
import {PREDICATE_FACTORY_ID, predicateFactory} from './DefaultPredicates';
import {JsonStringDeserializationPolicy} from '../config/JsonStringDeserializationPolicy';
import {REST_VALUE_FACTORY_ID, restValueFactory} from '../core/RestValue';
import {CompactStreamSerializerAdapter} from './compact/CompactStreamSerializerAdapter';
import {CompactStreamSerializer} from './compact/CompactStreamSerializer';
import {SchemaService} from './compact/SchemaService';

/** @internal */
export interface SerializationService {

    toData(object: any, partitioningStrategy?: any): Data;

    toObject(data: Data): any;

    writeObject(out: DataOutput, object: any): void;

    readObject(inp: DataInput): any;

    toDataAsync(object: any, partitioningStrategy?: any): Promise<Data>;

    toObjectAsync(data: Data): Promise<any>;

    writeObjectAsync(out: DataOutput, object: any): Promise<void>;

    readObjectAsync(inp: DataInput): Promise<any>;

}

type PartitionStrategy = (obj: any) => number;

const defaultPartitionStrategy = (obj: any): number => {
    if (obj == null || !obj['getPartitionHash']) {
        return 0;
    } else {
        return obj.getPartitionHash();
    }
}

/** @internal */
export class SerializationServiceV1 implements SerializationService {

    private readonly registry: { [id: number]: Serializer };
    private readonly serializerNameToId: { [name: string]: number };
    private readonly serializationConfig: SerializationConfigImpl;
    private readonly compactStreamSerializer: CompactStreamSerializer;

    constructor(serializationConfig: SerializationConfigImpl, schemaService: SchemaService) {
        this.serializationConfig = serializationConfig;
        this.registry = {};
        this.serializerNameToId = {};
        this.compactStreamSerializer = new CompactStreamSerializer(schemaService);
        this.registerDefaultSerializers();
        this.registerCustomSerializers();
        this.registerCompactSerializers();
        this.registerGlobalSerializer();
    }

    public isData(object: any): boolean {
        return object instanceof HeapData;
    }

    /**
     * Serializes object to data
     *
     * @param object Object to serialize
     * @param partitioningStrategy
     * @throws RangeError if object is not serializable
     */
    toData(object: any, partitioningStrategy: PartitionStrategy = defaultPartitionStrategy): Data {
        if (this.isData(object)) {
            return object as Data;
        }
        const dataOutput = new PositionalObjectDataOutput(this, this.serializationConfig.isBigEndian);
        const serializer = this.findSerializerFor(object);
        // Check if object is partition aware
        if (object != null && object.partitionKey != null) {
            const partitionKey = object.partitionKey;
            const serializedPartitionKey = this.toData(partitionKey);
            dataOutput.writeIntBE(this.calculatePartitionHash(serializedPartitionKey, partitioningStrategy));
        } else {
            dataOutput.writeIntBE(this.calculatePartitionHash(object, partitioningStrategy));
        }
        dataOutput.writeIntBE(serializer.id);
        (serializer as Serializer).write(dataOutput, object);
        return new HeapData(dataOutput.toBuffer());
    }

    toObject(data: Data): any {
        if (data == null) {
            return data;
        }
        if (!data.getType) {
            return data;
        }
        const serializer = this.findSerializerById(data.getType());
        if (serializer === undefined) {
            throw new RangeError(`There is no suitable deserializer for data with type ${data.getType()}`);
        }
        const dataInput = new ObjectDataInput(data.toBuffer(), DATA_OFFSET, this, this.serializationConfig.isBigEndian);
        return (serializer as Serializer).read(dataInput);
    }


    /**
     * Serializes object to data
     *
     * @param object Object to serialize
     * @param partitioningStrategy
     * @throws RangeError if object is not serializable
     */
    toDataAsync(object: any, partitioningStrategy: PartitionStrategy = defaultPartitionStrategy): Promise<Data> {
        if (this.isData(object)) {
            return Promise.resolve(object as Data);
        }
        const dataOutput = new PositionalObjectDataOutput(this, this.serializationConfig.isBigEndian);
        const serializer = this.findSerializerFor(object);
        // Check if object is partition aware
        if (object != null && object.partitionKey != null) {
            const partitionKey = object.partitionKey;
            const serializedPartitionKey = this.toData(partitionKey);
            dataOutput.writeIntBE(this.calculatePartitionHash(serializedPartitionKey, partitioningStrategy));
        } else {
            dataOutput.writeIntBE(this.calculatePartitionHash(object, partitioningStrategy));
        }
        dataOutput.writeIntBE(serializer.id);
        if (serializer instanceof CompactStreamSerializerAdapter) {
            return (serializer as AsyncSerializer).write(dataOutput, object).then(() => {
                return new HeapData(dataOutput.toBuffer());
            })
        } else {
            (serializer as Serializer).write(dataOutput, object)
            return Promise.resolve(new HeapData(dataOutput.toBuffer()));
        }


    }

    toObjectAsync(data: Data): Promise<any> {
        if (data == null) {
            return Promise.resolve(data);
        }
        if (!data.getType) {
            return Promise.resolve(data);
        }
        const serializer = this.findSerializerById(data.getType());
        if (serializer === undefined) {
            throw new RangeError(`There is no suitable deserializer for data with type ${data.getType()}`);
        }
        const dataInput = new ObjectDataInput(data.toBuffer(), DATA_OFFSET, this, this.serializationConfig.isBigEndian);
        if (serializer instanceof CompactStreamSerializerAdapter) {
            return serializer.read(dataInput).then((obj: any) => {
                return obj;
            })
        } else {
            return Promise.resolve(serializer.read(dataInput));
        }
    }

    writeObjectAsync(out: DataOutput, object: any): Promise<void> {
        const serializer = this.findSerializerFor(object);
        out.writeInt(serializer.id);
        return (serializer as AsyncSerializer).write(out, object);
    }

    readObjectAsync(inp: DataInput): Promise<any> {
        const serializerId = inp.readInt();
        const serializer = this.findSerializerById(serializerId);
        return (serializer as AsyncSerializer).read(inp);
    }

    writeObject(out: DataOutput, object: any): void {
        const serializer = this.findSerializerFor(object);
        out.writeInt(serializer.id);
        (serializer as Serializer).write(out, object);
    }

    readObject(inp: DataInput): any {
        const serializerId = inp.readInt();
        const serializer = this.findSerializerById(serializerId);
        return (serializer as Serializer).read(inp);
    }

    registerSerializer(name: string, serializer: Serializer): void {
        if (this.serializerNameToId[name]) {
            throw new RangeError('Given serializer name is already in the registry.');
        }
        if (this.registry[serializer.id]) {
            throw new RangeError('Given serializer id is already in the registry.');
        }
        this.serializerNameToId[name] = serializer.id;
        this.registry[serializer.id] = serializer;
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
     *  7. Compact Serializer
     *  8. Fallback (JSON)
     * @param obj
     * @returns
     */
    findSerializerFor(obj: any): Serializer | AsyncSerializer {
        if (obj === undefined) {
            throw new RangeError('undefined cannot be serialized.');
        }
        let serializer: Serializer = null;
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
            serializer = this.findSerializerByName('!compact', false);
        }
        if (serializer === null) {
            serializer = this.findSerializerByName('!json', false);
        }
        if (serializer === null) {
            throw new RangeError('There is no suitable serializer for ' + obj + '.');
        }
        return serializer;

    }

    private lookupDefaultSerializer(obj: any): Serializer {
        let serializer: Serializer = null;
        if (this.isCompactSerializable(obj)) {
            return this.findSerializerByName('!compact', false);
        }
        if (SerializationServiceV1.isIdentifiedDataSerializable(obj)) {
            return this.findSerializerByName('identified', false);
        }
        if (SerializationServiceV1.isPortableSerializable(obj)) {
            return this.findSerializerByName('!portable', false);
        }

        const objectType = Util.getType(obj);
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

    private lookupCustomSerializer(obj: any): Serializer {
        if (SerializationServiceV1.isCustomSerializable(obj)) {
            return this.findSerializerById(obj.hzCustomId);
        }
        return null;
    }

    private lookupGlobalSerializer(): Serializer {
        return this.findSerializerByName('!global', false);
    }

    private static isIdentifiedDataSerializable(obj: any): boolean {
        return (obj.readData && obj.writeData
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }

    private static isPortableSerializable(obj: any): boolean {
        return (obj.readPortable && obj.writePortable
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }

    private isCompactSerializable(obj: any): boolean {
        // Null object case: Object.create(null)
        if (!obj.constructor) {
            return false;
        }
        return this.compactStreamSerializer.isRegisteredAsCompact(obj.constructor.name);
    }

    private registerDefaultSerializers(): void {
        this.registerSerializer('string', new StringSerializer());
        this.registerSerializer('double', new DoubleSerializer());
        this.registerSerializer('byte', new ByteSerializer());
        this.registerSerializer('boolean', new BooleanSerializer());
        this.registerSerializer('null', new NullSerializer());
        this.registerSerializer('short', new ShortSerializer());
        this.registerSerializer('integer', new IntegerSerializer());
        this.registerSerializer('long', new LongSerializer());
        this.registerSerializer('float', new FloatSerializer());
        this.registerSerializer('char', new CharSerializer());
        this.registerSerializer('date', new DateSerializer());
        this.registerSerializer('localDate', new LocalDateSerializer());
        this.registerSerializer('localTime', new LocalTimeSerializer());
        this.registerSerializer('localDateTime', new LocalDateTimeSerializer());
        this.registerSerializer('offsetDateTime', new OffsetDateTimeSerializer());
        this.registerSerializer('byteArray', new ByteArraySerializer());
        this.registerSerializer('charArray', new CharArraySerializer());
        this.registerSerializer('booleanArray', new BooleanArraySerializer());
        this.registerSerializer('shortArray', new ShortArraySerializer());
        this.registerSerializer('integerArray', new IntegerArraySerializer());
        this.registerSerializer('longArray', new LongArraySerializer());
        this.registerSerializer('doubleArray', new DoubleArraySerializer());
        this.registerSerializer('stringArray', new StringArraySerializer());
        this.registerSerializer('javaClass', new JavaClassSerializer());
        this.registerSerializer('floatArray', new FloatArraySerializer());
        this.registerSerializer('arrayList', new ArrayListSerializer());
        this.registerSerializer('linkedList', new LinkedListSerializer());
        this.registerSerializer('uuid', new UuidSerializer());
        this.registerSerializer('bigDecimal', new BigDecimalSerializer());
        this.registerSerializer('bigint', new BigIntSerializer());
        this.registerIdentifiedFactories();
        this.registerSerializer('!portable', new PortableSerializer(this.serializationConfig));
        this.registerSerializer('!compact', new CompactStreamSerializerAdapter(this.compactStreamSerializer));
        if (this.serializationConfig.jsonStringDeserializationPolicy === JsonStringDeserializationPolicy.EAGER) {
            this.registerSerializer('!json', new JsonSerializer());
        } else {
            this.registerSerializer('!json', new HazelcastJsonValueSerializer());
        }
    }

    private registerIdentifiedFactories(): void {
        const factories: { [id: number]: IdentifiedDataSerializableFactory } = {};
        for (const id in this.serializationConfig.dataSerializableFactories) {
            factories[id] = this.serializationConfig.dataSerializableFactories[id];
        }
        factories[PREDICATE_FACTORY_ID] = predicateFactory;
        factories[RELIABLE_TOPIC_MESSAGE_FACTORY_ID] = reliableTopicMessageFactory;
        factories[CLUSTER_DATA_FACTORY_ID] = clusterDataFactory;
        factories[AGGREGATOR_FACTORY_ID] = aggregatorFactory;
        factories[REST_VALUE_FACTORY_ID] = restValueFactory;
        this.registerSerializer('identified', new IdentifiedDataSerializableSerializer(factories));
    }

    private registerCustomSerializers(): void {
        const customSerializers = this.serializationConfig.customSerializers;
        for (const key in customSerializers) {
            const candidate = customSerializers[key];
            SerializationServiceV1.assertValidCustomSerializer(candidate);
            this.registerSerializer('!custom' + candidate.id, candidate);
        }
    }

    private registerCompactSerializers(): void {
        const compactSerializers = this.serializationConfig.compactSerializers;
        for (const compactSerializer of compactSerializers) {
            this.compactStreamSerializer.registerSerializer(compactSerializer);
        }
    }

    private registerGlobalSerializer(): void {
        const candidate: any = this.serializationConfig.globalSerializer;
        if (candidate == null) {
            return;
        }
        SerializationServiceV1.assertValidCustomSerializer(candidate);
        this.registerSerializer('!global', candidate);
    }

    private static assertValidCustomSerializer(candidate: any): void {
        const idProp = 'id';
        const fRead = 'read';
        const fWrite = 'write';
        if (typeof candidate[idProp] !== 'number') {
            throw new TypeError('Custom serializer should have ' + idProp + ' property.');
        }
        if (typeof candidate[fRead] !== 'function' || typeof candidate[fWrite] !== 'function') {
            throw new TypeError('Custom serializer should have ' + fRead + ' and ' + fWrite + ' methods.');
        }
        const typeId = candidate[idProp];
        if (!Number.isInteger(typeId) || typeId < 1) {
            throw new TypeError('Custom serializer should have its typeId greater than or equal to 1.');
        }
    }

    private static isCustomSerializable(object: any): boolean {
        const prop = 'hzCustomId';
        return (typeof object[prop] === 'number' && object[prop] >= 1);
    }

    private findSerializerByName(name: string, isArray: boolean): Serializer {
        let convertedName: string;
        if (name === 'number') {
            convertedName = this.serializationConfig.defaultNumberType;
        } else if (name === 'buffer') {
            convertedName = 'byteArray';
        } else {
            convertedName = name;
        }
        const serializerName = convertedName + (isArray ? 'Array' : '');
        const serializerId = this.serializerNameToId[serializerName];
        if (serializerId == null) {
            return null;
        }
        return this.findSerializerById(serializerId);
    }

    private findSerializerById(id: number): Serializer | AsyncSerializer {
        const serializer = this.registry[id];
        return serializer;
    }

    private calculatePartitionHash(object: any, strategy: PartitionStrategy): number {
        return strategy(object);
    }
}
