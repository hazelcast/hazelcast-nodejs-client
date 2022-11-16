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
import * as Util from '../util/Util';
import {AGGREGATOR_FACTORY_ID} from '../aggregation/AggregatorConstants';
import {aggregatorFactory} from '../aggregation/Aggregator';
import {CLUSTER_DATA_FACTORY_ID, clusterDataFactory} from './ClusterDataFactory';
import {SerializationConfigImpl} from '../config/SerializationConfig';
import {
    RELIABLE_TOPIC_MESSAGE_FACTORY_ID,
    reliableTopicMessageFactory,
} from '../proxy/topic/ReliableTopicMessage';
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
import {SerializationSymbols} from './SerializationSymbols'
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
import {BigDecimal, IllegalArgumentError, LocalDate, LocalDateTime, LocalTime, OffsetDateTime, UUID} from '../core';

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

/**
 * The type key that is used in serializer registration for a object type.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type TypeKey = Function | Symbol;

/** @internal */
export class SerializationServiceV1 implements SerializationService {

    private readonly registry: { [id: number]: Serializer };

    // We hold default type serializers in a Map. Key values will be class types or Symbol and values
    // will be serializers( one is type serializer and second one is array serializer of that object)
    // Some of the types do not have equivalent class on Nodejs (Byte, Short, Null and etc.), so we need to use
    // unique values for these types as a Symbol (defined in @SerializationSymbols).
    // For these types we use unique Symbol as a key value.
    private readonly typeKeyToSerializersMap : Map<TypeKey, [Serializer, Serializer]>;
    private readonly compactStreamSerializer: CompactStreamSerializer;
    private readonly portableSerializer: PortableSerializer;
    private readonly identifiedSerializer: IdentifiedDataSerializableSerializer;
    private readonly typeKeyForDefaultNumberType : TypeKey;

    constructor(
        private readonly serializationConfig: SerializationConfigImpl,
        schemaService: SchemaService
    ) {
        this.registry = {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.typeKeyToSerializersMap = new Map<TypeKey, [Serializer, Serializer]>();
        this.compactStreamSerializer = new CompactStreamSerializer(schemaService);
        this.portableSerializer = new PortableSerializer(this.serializationConfig);
        this.identifiedSerializer = this.createIdentifiedSerializer();
        this.registerDefaultSerializers();
        this.registerCustomSerializers();
        this.registerCompactSerializers();
        this.registerGlobalSerializer();
        this.typeKeyForDefaultNumberType = Util.getTypeKeyForDefaultNumberType(this.serializationConfig.defaultNumberType);

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

    /**
     * Registers a serializer to the system.
     * @param typeKey A typekey is either a constructor function or a symbol, defining the type of the object to be serialized.
     * @param serializer The serializer to be registered.
     * @param arraySerializer The serializer to be used for arrays of the given type. Global and custom serializers don't have
     * this one and this should be null. For some types we don't have array serializers defined, for them this should be null
     * as well.
     */
    registerSerializer(typeKey: TypeKey, serializer: Serializer, arraySerializer: Serializer | null): void {
        if (this.typeKeyToSerializersMap.has(typeKey)) {
            throw new RangeError('Given serializer type is already in the registry.');
        }
        if (this.registry[serializer.id]) {
            throw new RangeError('Given serializer id is already in the registry.');
        }
        this.typeKeyToSerializersMap.set(typeKey, [serializer, arraySerializer]);
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
            serializer = this.findSerializerByType(SerializationSymbols.NULL_SYMBOL, false);
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
            serializer = this.findSerializerByType(SerializationSymbols.JSON_SYMBOL, false);
        }
        if (serializer === null) {
            throw new RangeError('There is no suitable serializer for ' + obj + '.');
        }
        return serializer;

    }

    private lookupDefaultSerializer(obj: any): Serializer | null {
        if (this.isCompactSerializable(obj)) {
            return this.compactStreamSerializer;
        }
        if (SerializationServiceV1.isIdentifiedDataSerializable(obj)) {
            return this.identifiedSerializer;
        }
        if (SerializationServiceV1.isPortableSerializable(obj)) {
            return this.portableSerializer
        }

        const isArray = Array.isArray(obj);
        if (!isArray) {
            // Number needs special care because it can be serialized with one of many serializers.
            if (typeof obj === 'number') {
                return this.findSerializerByType(this.typeKeyForDefaultNumberType, isArray);
            }
            // We know obj is not undefined or null at this point, meaning it has a constructor field.
            return this.findSerializerByType(obj.constructor, isArray);
        }
        return this.lookupDefaultSerializerForArray(obj);
    }

    private lookupDefaultSerializerForArray(obj: Array<any>): Serializer | null {
        if (obj.length === 0) {
            return this.findSerializerByType(this.typeKeyForDefaultNumberType, true);
        }
        const firstElement = obj[0];
        // First element can be anything. Check for null and undefined.
        if (firstElement === null) {
            return this.findSerializerByType(SerializationSymbols.NULL_SYMBOL, true);
        } else if (firstElement === undefined) {
            throw new RangeError('Array serialization type is determined using the first element. '
                + 'The first element is undefined. Throwing an error because undefined cannot be'
                + ' serialized in Hazelcast serialization.');
        } else if (typeof firstElement === 'number') {
            // Number needs special care because it can be serialized with one of many serializers.
            return this.findSerializerByType(this.typeKeyForDefaultNumberType, true);
        }
        return this.findSerializerByType(obj[0].constructor, true);
    }

    private lookupCustomSerializer(obj: any): Serializer {
        // Note: What about arrays of custom serializable objects?
        if (SerializationServiceV1.isCustomSerializable(obj)) {
            // We can also use findSerializerByType with Symbol.for. It should not matter.
            return this.findSerializerById(obj.hzCustomId);
        }
        return null;
    }

    private lookupGlobalSerializer(): Serializer {
        return this.findSerializerByType(SerializationSymbols.GLOBAL_SYMBOL, false);
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
     * Must be called in the constructor after completing registering default serializers.
     */
    private verifyDefaultSerializersNotOverriddenWithCompact(): void {
        const compactSerializers = this.serializationConfig.compact.serializers;
        for (const compact of compactSerializers) {
            const clazz = compact.getClass();
            if (this.typeKeyToSerializersMap.has(clazz) || clazz === Number) {
                // From the config validation, we know clazz is a function, so we can use the name field of it.
                throw new IllegalArgumentError(
                    `Compact serializer for the class ${clazz.name} and typename ${compact.getTypeName()}`
                  + ' can not be registered as it overrides a default serializer for that class provided by Hazelcast.');
            }
        }
    }

    isCompactSerializable(obj: any): boolean {
       if (obj instanceof CompactGenericRecordImpl) {
            return true;
        }

        return this.compactStreamSerializer.isRegisteredAsCompact(obj.constructor);
    }

    private registerDefaultSerializers(): void {
        this.registerSerializer(String, new StringSerializer(), new StringArraySerializer());
        this.registerSerializer(SerializationSymbols.DOUBLE_SYMBOL, new DoubleSerializer(), new DoubleArraySerializer());
        this.registerSerializer(SerializationSymbols.BYTE_SYMBOL , new ByteSerializer(), new ByteArraySerializer());
        this.registerSerializer(Boolean, new BooleanSerializer(), new BooleanArraySerializer());
        this.registerSerializer(SerializationSymbols.NULL_SYMBOL, new NullSerializer(), null);
        this.registerSerializer(SerializationSymbols.SHORT_SYMBOL, new ShortSerializer(), new ShortArraySerializer());
        this.registerSerializer(SerializationSymbols.INTEGER_SYMBOL, new IntegerSerializer(), new IntegerArraySerializer());
        this.registerSerializer(Long, new LongSerializer(), new LongArraySerializer());
        this.registerSerializer(SerializationSymbols.FLOAT_SYMBOL, new FloatSerializer(), new FloatArraySerializer());
        this.registerSerializer(SerializationSymbols.CHAR_SYMBOL, new CharSerializer(), new CharArraySerializer());
        this.registerSerializer(Date, new DateSerializer(), null);
        this.registerSerializer(LocalDate, new LocalDateSerializer(), null);
        this.registerSerializer(LocalTime, new LocalTimeSerializer(), null);
        this.registerSerializer(LocalDateTime, new LocalDateTimeSerializer(), null);
        this.registerSerializer(OffsetDateTime, new OffsetDateTimeSerializer(), null);
        this.registerSerializer(SerializationSymbols.JAVACLASS_SYMBOL, new JavaClassSerializer(), null);
        this.registerSerializer(SerializationSymbols.ARRAYLIST_SYMBOL, new ArrayListSerializer(), null);
        this.registerSerializer(SerializationSymbols.LINKEDLIST_SYMBOL, new LinkedListSerializer(), null);
        this.registerSerializer(UUID, new UuidSerializer(), null);
        this.registerSerializer(BigDecimal, new BigDecimalSerializer(), null);
        this.registerSerializer(BigInt, new BigIntSerializer(), null);
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
            this.registerSerializer(Symbol.for('!custom' + customSerializer.id), customSerializer, null);
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
        this.registerSerializer(SerializationSymbols.GLOBAL_SYMBOL, candidate, null);
    }

    private static isCustomSerializable(object: any): boolean {
        const prop = 'hzCustomId';
        return (typeof object[prop] === 'number' && object[prop] >= 1);
    }

    private findSerializerByType(typeKey: TypeKey, isArray: boolean): Serializer | null {
        if (typeKey === Buffer) {
            typeKey = SerializationSymbols.BYTE_SYMBOL;
            isArray = true;
        }
        const serializers = this.typeKeyToSerializersMap.get(typeKey);
        if (serializers === undefined) {
            return null;
        }
        return isArray ? serializers[1] : serializers[0];
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
