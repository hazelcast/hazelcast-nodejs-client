/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
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
import {Serializer, IdentifiedDataSerializableFactory} from './Serializable';
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
    UuidSerializer,
    JavaArraySerializer
} from './DefaultSerializers';
import { SerializationSymbols, getTypes } from './SerializationSymbols'
import {DATA_OFFSET, HeapData} from './HeapData';
import {ObjectDataInput, PositionalObjectDataOutput} from './ObjectData';
import {PortableSerializer} from './portable/PortableSerializer';
import {PREDICATE_FACTORY_ID, predicateFactory} from './DefaultPredicates';
import {JsonStringDeserializationPolicy} from '../config/JsonStringDeserializationPolicy';
import {REST_VALUE_FACTORY_ID, restValueFactory} from '../core/RestValue';
import {CompactStreamSerializer} from './compact/CompactStreamSerializer';
import {SchemaService} from './compact/SchemaService';
import {CompactGenericRecordImpl} from './generic_record';
import {Schema} from './compact/Schema';
import { BigDecimal, IllegalArgumentError, LocalDate, LocalDateTime, LocalTime, OffsetDateTime, UUID } from '../core';

/**
 * Serializes objects and deserializes data.
 * @internal
 */
export interface SerializationService {

    toData(object: any, partitioningStrategy?: any): Data;

    toObject(data: Data): any;

    writeObject(out: DataOutput, object: any): void;

    readObject(inp: DataInput): any;

    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchemaToClass(schema: Schema, clazz: Function): void;
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    private readonly classToSerializerMap   : Map<Function | Symbol, [Serializer, Serializer]>;
    private readonly compactStreamSerializer: CompactStreamSerializer;
    private readonly portableSerializer: PortableSerializer;
    private readonly identifiedSerializer: IdentifiedDataSerializableSerializer;

    constructor(
        private readonly serializationConfig: SerializationConfigImpl,
        schemaService: SchemaService
    ) {
        this.registry = {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.classToSerializerMap = new Map<Function, [Serializer, Serializer]>();
        this.compactStreamSerializer = new CompactStreamSerializer(schemaService);
        this.portableSerializer = new PortableSerializer(this.serializationConfig);
        this.identifiedSerializer = this.createIdentifiedSerializer();
        this.registerDefaultSerializers();
        this.registerCustomSerializers();
        this.registerCompactSerializers();
        this.registerGlobalSerializer();

        // Called here so that we can make sure that we are not overriding
        // any of the default serializers registered above with the Compact
        // serialization.
        this.verifyDefaultSerializersNotOverriddenWithCompact();
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
            dataOutput.writeIntBE(SerializationServiceV1.calculatePartitionHash(serializedPartitionKey, partitioningStrategy));
        } else {
            dataOutput.writeIntBE(SerializationServiceV1.calculatePartitionHash(object, partitioningStrategy));
        }
        dataOutput.writeIntBE(serializer.id);
        serializer.write(dataOutput, object);
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
        return serializer.read(dataInput);
    }

    writeObject(out: DataOutput, object: any): void {
        const serializer = this.findSerializerFor(object);
        out.writeInt(serializer.id);
        serializer.write(out, object);
    }

    readObject(inp: DataInput): any {
        const serializerId = inp.readInt();
        const serializer = this.findSerializerById(serializerId);
        return serializer.read(inp);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSerializer(clazz: Function | Symbol, serializer: Serializer, arraySerializer?: Serializer): void {
        if (this.classToSerializerMap.has(clazz)) {
            throw new RangeError('Given serializer name is already in the registry.');
        }
        if (this.registry[serializer.id]) {
            throw new RangeError('Given serializer id is already in the registry.');
        }
        this.classToSerializerMap.set(clazz, [serializer, arraySerializer]);
        this.registry[serializer.id] = serializer;
        if (arraySerializer) {
            this.registry[arraySerializer.id] = arraySerializer;
        }
    }

    /**
     * Serialization precedence
     *  1. NULL
     *  2. Compact
     *  3. DataSerializable
     *  4. Portable
     *  5. Default Types
     *      * Byte, Boolean, Character, Short, Integer, Long, Float, Double, String
     *      * Array of [Byte, Boolean, Character, Short, Integer, Long, Float, Double, String]
     *      * Java types [Date, BigInteger, BigDecimal, Class, Enum]
     *  6. Custom serializers
     *  7. Global Serializer
     *  8. Fallback (JSON)
     * @param obj
     * @returns
     */
    findSerializerFor(obj: any): Serializer {
        if (obj === undefined) {
            throw new RangeError('undefined cannot be serialized.');
        }
        let serializer: Serializer = null;
        if (obj === null) {
            serializer = this.findSerializerByName(SerializationSymbols.NULL_SYMBOL, false);
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
            serializer = this.findSerializerByName(SerializationSymbols.JSON_SYMBOL, false);
        }
        if (serializer === null) {
            throw new RangeError('There is no suitable serializer for ' + obj + '.');
        }
        return serializer;

    }

    private lookupDefaultSerializer(obj: any): Serializer {
        let serializer: Serializer = null;
        if (this.isCompactSerializable(obj)) {
            return this.compactStreamSerializer;
        }
        if (SerializationServiceV1.isIdentifiedDataSerializable(obj)) {
            return this.identifiedSerializer;
        }
        if (SerializationServiceV1.isPortableSerializable(obj)) {
            return this.portableSerializer
        }

        const objectType = Util.getType(obj);
        if (objectType === 'array') {
            if (obj.length === 0) {
                serializer = this.findSerializerByName(Number.prototype.constructor, true);
            } else {
                serializer = this.findSerializerByName(obj[0], true);
            }
        } else {
            serializer = this.findSerializerByName(obj, false);
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
        return this.findSerializerByName(SerializationSymbols.GLOBAL_SYMBOL, false);
    }

    private static isIdentifiedDataSerializable(obj: any): boolean {
        return (obj.readData && obj.writeData
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }

    private static isPortableSerializable(obj: any): boolean {
        return (obj.readPortable && obj.writePortable
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }

    /**
     * Makes sure that the classes registered as Compact serializable are not
     * overriding the default serializers.
     * 
     * Must be called in the constructor of the child classes after they
     * complete registering default serializers.
     */
    private verifyDefaultSerializersNotOverriddenWithCompact(): void {
        const compactSerializers = this.serializationConfig.compact.serializers;
        for (const compact of compactSerializers) {
            if (!this.classToSerializerMap.has(compact.getClass())) {
                continue;
            }
            
            throw new IllegalArgumentError(`Compact serializer for the class ${compact.getTypeName()} can not be 
                registered as it overrides the default serializer for that class provided by Hazelcast.`);

        }
    }

    isCompactSerializable(obj: any): boolean {
       if (obj instanceof CompactGenericRecordImpl) {
            return true;
        }

        return this.compactStreamSerializer.isRegisteredAsCompact(obj.constructor);
    }

    private registerDefaultSerializers(): void {
        this.registerSerializer(String.prototype.constructor, new StringSerializer(), new StringArraySerializer());
        this.registerSerializer(Number.prototype.constructor, new DoubleSerializer(), new DoubleArraySerializer());
        this.registerSerializer(SerializationSymbols.BYTE_SYMBOL , new ByteSerializer(), new ByteArraySerializer());
        this.registerSerializer(Boolean.prototype.constructor, new BooleanSerializer(), new BooleanArraySerializer());
        this.registerSerializer(SerializationSymbols.NULL_SYMBOL, new NullSerializer(), null);
        this.registerSerializer(SerializationSymbols.SHORT_SYMBOL, new ShortSerializer(), new ShortArraySerializer());
        this.registerSerializer(SerializationSymbols.INTEGER_SYMBOL, new IntegerSerializer(), new IntegerArraySerializer());
        this.registerSerializer(Long.prototype.constructor, new LongSerializer(), new LongArraySerializer());
        this.registerSerializer(SerializationSymbols.FLOAT_SYMBOL, new FloatSerializer(), new FloatArraySerializer());
        this.registerSerializer(SerializationSymbols.CHAR_SYMBOL, new CharSerializer(), new CharArraySerializer());
        this.registerSerializer(Date.prototype.constructor, new DateSerializer(), null);
        this.registerSerializer(LocalDate.prototype.constructor, new LocalDateSerializer(), null);
        this.registerSerializer(LocalTime.prototype.constructor, new LocalTimeSerializer(), null);
        this.registerSerializer(LocalDateTime.prototype.constructor, new LocalDateTimeSerializer(), null);
        this.registerSerializer(OffsetDateTime.prototype.constructor, new OffsetDateTimeSerializer(), null);
        this.registerSerializer(SerializationSymbols.JAVACLASS_SYMBOL, new JavaClassSerializer(), null);
        this.registerSerializer(SerializationSymbols.ARRAYLIST_SYMBOL, new ArrayListSerializer(), null);
        this.registerSerializer(SerializationSymbols.LINKLIST_SYMBOL, new LinkedListSerializer(), null);
        this.registerSerializer(UUID.prototype.constructor, new UuidSerializer(), null);
        this.registerSerializer(BigDecimal.prototype.constructor, new BigDecimalSerializer(), null);
        this.registerSerializer(BigInt.prototype.constructor, new BigIntSerializer(), null);
        this.registerSerializer(SerializationSymbols.JAVA_ARRAY_SYMBOL, new JavaArraySerializer(), null);
        this.registerSerializer(SerializationSymbols.COMPACT_SYMBOL, this.compactStreamSerializer, null);
        this.registerSerializer(SerializationSymbols.IDENTIFIED_SYMBOL, this.identifiedSerializer, null);
        this.registerSerializer(SerializationSymbols.PORTABLE_SYMBOL, this.portableSerializer, null);

        if (this.serializationConfig.jsonStringDeserializationPolicy === JsonStringDeserializationPolicy.EAGER) {
            this.registerSerializer(SerializationSymbols.JSON_SYMBOL, new JsonSerializer(), null);
        } else {
            this.registerSerializer(SerializationSymbols.JSON_SYMBOL, new HazelcastJsonValueSerializer(), null);
        }
    }

    private createIdentifiedSerializer(): IdentifiedDataSerializableSerializer {
        const factories: { [id: number]: IdentifiedDataSerializableFactory } = {};
        for (const id in this.serializationConfig.dataSerializableFactories) {
            factories[id] = this.serializationConfig.dataSerializableFactories[id];
        }
        factories[PREDICATE_FACTORY_ID] = predicateFactory;
        factories[RELIABLE_TOPIC_MESSAGE_FACTORY_ID] = reliableTopicMessageFactory;
        factories[CLUSTER_DATA_FACTORY_ID] = clusterDataFactory;
        factories[AGGREGATOR_FACTORY_ID] = aggregatorFactory;
        factories[REST_VALUE_FACTORY_ID] = restValueFactory;
        return new IdentifiedDataSerializableSerializer(factories);
    }

    private registerCustomSerializers(): void {
        const customSerializers = this.serializationConfig.customSerializers;
        for (const customSerializer of customSerializers) {
            this.registerSerializer(Symbol.for('!custom' + customSerializer.id), customSerializer);
        }
    }

    private registerCompactSerializers(): void {
        const compactSerializers = this.serializationConfig.compact.serializers;
        for (const compactSerializer of compactSerializers) {
            this.compactStreamSerializer.registerSerializer(compactSerializer);
        }
    }

    private registerGlobalSerializer(): void {
        const candidate: any = this.serializationConfig.globalSerializer;
        if (candidate == null) {
            return;
        }
        this.registerSerializer(SerializationSymbols.GLOBAL_SYMBOL, candidate);
    }

    private static isCustomSerializable(object: any): boolean {
        const prop = 'hzCustomId';
        return (typeof object[prop] === 'number' && object[prop] >= 1);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types    
    private findSerializerByName(clazz: Function | Symbol, isArray: boolean): Serializer {
        const clazzType = typeof clazz == 'symbol' ? clazz : clazz.constructor;
        const isArrayChange = (clazz.constructor == Buffer) ? true : isArray;
        const objectKeyValue = getTypes(clazzType);
        if (objectKeyValue) {
            const serializers = this.classToSerializerMap.get(objectKeyValue);
            if (serializers) {
                if (isArrayChange) {
                    return serializers.length == 2 && serializers[1] ? serializers[1] : null;
                }
                return serializers[0];
            }
        }
        return null;
    }

    private findSerializerById(id: number): Serializer {
        return this.registry[id];
    }

    private static calculatePartitionHash(object: any, strategy: PartitionStrategy): number {
        return strategy(object);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchemaToClass(schema: Schema, clazz: Function): void {
        this.compactStreamSerializer.registerSchemaToClass(schema, clazz);
    }
}
