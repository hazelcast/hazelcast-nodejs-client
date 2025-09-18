"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializationServiceV1 = void 0;
const Long = require("long");
const Util = require("../util/Util");
const AggregatorConstants_1 = require("../aggregation/AggregatorConstants");
const Aggregator_1 = require("../aggregation/Aggregator");
const ClusterDataFactory_1 = require("./ClusterDataFactory");
const ReliableTopicMessage_1 = require("../proxy/topic/ReliableTopicMessage");
const DefaultSerializers_1 = require("./DefaultSerializers");
const SerializationSymbols_1 = require("./SerializationSymbols");
const HeapData_1 = require("./HeapData");
const ObjectData_1 = require("./ObjectData");
const PortableSerializer_1 = require("./portable/PortableSerializer");
const DefaultPredicates_1 = require("./DefaultPredicates");
const JsonStringDeserializationPolicy_1 = require("../config/JsonStringDeserializationPolicy");
const RestValue_1 = require("../core/RestValue");
const CompactStreamSerializer_1 = require("./compact/CompactStreamSerializer");
const generic_record_1 = require("./generic_record");
const core_1 = require("../core");
const defaultPartitionStrategy = (obj) => {
    if (obj == null || !obj['getPartitionHash']) {
        return 0;
    }
    else {
        return obj.getPartitionHash();
    }
};
/** @internal */
class SerializationServiceV1 {
    constructor(serializationConfig, schemaService) {
        this.serializationConfig = serializationConfig;
        this.registry = {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.typeKeyToSerializersMap = new Map();
        this.compactStreamSerializer = new CompactStreamSerializer_1.CompactStreamSerializer(schemaService);
        this.portableSerializer = new PortableSerializer_1.PortableSerializer(this.serializationConfig);
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
    isData(object) {
        return object instanceof HeapData_1.HeapData;
    }
    /**
     * Serializes object to data
     *
     * @param object Object to serialize
     * @param partitioningStrategy
     * @throws RangeError if object is not serializable
     */
    toData(object, partitioningStrategy = defaultPartitionStrategy) {
        if (this.isData(object)) {
            return object;
        }
        const dataOutput = new ObjectData_1.PositionalObjectDataOutput(this, this.serializationConfig.isBigEndian);
        const serializer = this.findSerializerFor(object);
        // Check if object is partition aware
        if (object != null && object.partitionKey != null) {
            const partitionKey = object.partitionKey;
            const serializedPartitionKey = this.toData(partitionKey);
            dataOutput.writeIntBE(SerializationServiceV1.calculatePartitionHash(serializedPartitionKey, partitioningStrategy));
        }
        else {
            dataOutput.writeIntBE(SerializationServiceV1.calculatePartitionHash(object, partitioningStrategy));
        }
        dataOutput.writeIntBE(serializer.id);
        serializer.write(dataOutput, object);
        return new HeapData_1.HeapData(dataOutput.toBuffer());
    }
    toObject(data) {
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
        const dataInput = new ObjectData_1.ObjectDataInput(data.toBuffer(), HeapData_1.DATA_OFFSET, this, this.serializationConfig.isBigEndian);
        return serializer.read(dataInput);
    }
    writeObject(out, object) {
        const serializer = this.findSerializerFor(object);
        out.writeInt(serializer.id);
        serializer.write(out, object);
    }
    readObject(inp) {
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
    registerSerializer(typeKey, serializer, arraySerializer) {
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
    findSerializerFor(obj) {
        if (obj === undefined) {
            throw new RangeError('undefined cannot be serialized.');
        }
        let serializer = null;
        if (obj === null) {
            serializer = this.findSerializerByType(SerializationSymbols_1.SerializationSymbols.NULL_SYMBOL, false);
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
            serializer = this.findSerializerByType(SerializationSymbols_1.SerializationSymbols.JSON_SYMBOL, false);
        }
        if (serializer === null) {
            throw new RangeError('There is no suitable serializer for ' + obj + '.');
        }
        return serializer;
    }
    lookupDefaultSerializer(obj) {
        if (this.isCompactSerializable(obj)) {
            return this.compactStreamSerializer;
        }
        if (SerializationServiceV1.isIdentifiedDataSerializable(obj)) {
            return this.identifiedSerializer;
        }
        if (SerializationServiceV1.isPortableSerializable(obj)) {
            return this.portableSerializer;
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
    lookupDefaultSerializerForArray(obj) {
        if (obj.length === 0) {
            return this.findSerializerByType(this.typeKeyForDefaultNumberType, true);
        }
        const firstElement = obj[0];
        // First element can be anything. Check for null and undefined.
        if (firstElement === null) {
            return this.findSerializerByType(SerializationSymbols_1.SerializationSymbols.NULL_SYMBOL, true);
        }
        else if (firstElement === undefined) {
            throw new RangeError('Array serialization type is determined using the first element. '
                + 'The first element is undefined. Throwing an error because undefined cannot be'
                + ' serialized in Hazelcast serialization.');
        }
        else if (typeof firstElement === 'number') {
            // Number needs special care because it can be serialized with one of many serializers.
            return this.findSerializerByType(this.typeKeyForDefaultNumberType, true);
        }
        return this.findSerializerByType(obj[0].constructor, true);
    }
    lookupCustomSerializer(obj) {
        // Note: What about arrays of custom serializable objects?
        if (SerializationServiceV1.isCustomSerializable(obj)) {
            // We can also use findSerializerByType with Symbol.for. It should not matter.
            return this.findSerializerById(obj.hzCustomId);
        }
        return null;
    }
    lookupGlobalSerializer() {
        return this.findSerializerByType(SerializationSymbols_1.SerializationSymbols.GLOBAL_SYMBOL, false);
    }
    static isIdentifiedDataSerializable(obj) {
        return (obj.readData && obj.writeData
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }
    static isPortableSerializable(obj) {
        return (obj.readPortable && obj.writePortable
            && typeof obj.factoryId === 'number' && typeof obj.classId === 'number');
    }
    /**
     * Makes sure that the classes registered as Compact serializable are not
     * overriding the default serializers.
     *
     * Must be called in the constructor after completing registering default serializers.
     */
    verifyDefaultSerializersNotOverriddenWithCompact() {
        const compactSerializers = this.serializationConfig.compact.serializers;
        for (const compact of compactSerializers) {
            const clazz = compact.getClass();
            if (this.typeKeyToSerializersMap.has(clazz) || clazz === Number) {
                // From the config validation, we know clazz is a function, so we can use the name field of it.
                throw new core_1.IllegalArgumentError(`Compact serializer for the class ${clazz.name} and typename ${compact.getTypeName()}`
                    + ' can not be registered as it overrides a default serializer for that class provided by Hazelcast.');
            }
        }
    }
    isCompactSerializable(obj) {
        if (obj instanceof generic_record_1.CompactGenericRecordImpl) {
            return true;
        }
        return this.compactStreamSerializer.isRegisteredAsCompact(obj.constructor);
    }
    registerDefaultSerializers() {
        this.registerSerializer(String, new DefaultSerializers_1.StringSerializer(), new DefaultSerializers_1.StringArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.DOUBLE_SYMBOL, new DefaultSerializers_1.DoubleSerializer(), new DefaultSerializers_1.DoubleArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.BYTE_SYMBOL, new DefaultSerializers_1.ByteSerializer(), new DefaultSerializers_1.ByteArraySerializer());
        this.registerSerializer(Boolean, new DefaultSerializers_1.BooleanSerializer(), new DefaultSerializers_1.BooleanArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.NULL_SYMBOL, new DefaultSerializers_1.NullSerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.SHORT_SYMBOL, new DefaultSerializers_1.ShortSerializer(), new DefaultSerializers_1.ShortArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.INTEGER_SYMBOL, new DefaultSerializers_1.IntegerSerializer(), new DefaultSerializers_1.IntegerArraySerializer());
        this.registerSerializer(Long, new DefaultSerializers_1.LongSerializer(), new DefaultSerializers_1.LongArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.FLOAT_SYMBOL, new DefaultSerializers_1.FloatSerializer(), new DefaultSerializers_1.FloatArraySerializer());
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.CHAR_SYMBOL, new DefaultSerializers_1.CharSerializer(), new DefaultSerializers_1.CharArraySerializer());
        this.registerSerializer(Date, new DefaultSerializers_1.DateSerializer(), null);
        this.registerSerializer(core_1.LocalDate, new DefaultSerializers_1.LocalDateSerializer(), null);
        this.registerSerializer(core_1.LocalTime, new DefaultSerializers_1.LocalTimeSerializer(), null);
        this.registerSerializer(core_1.LocalDateTime, new DefaultSerializers_1.LocalDateTimeSerializer(), null);
        this.registerSerializer(core_1.OffsetDateTime, new DefaultSerializers_1.OffsetDateTimeSerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.JAVACLASS_SYMBOL, new DefaultSerializers_1.JavaClassSerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.ARRAYLIST_SYMBOL, new DefaultSerializers_1.ArrayListSerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.LINKEDLIST_SYMBOL, new DefaultSerializers_1.LinkedListSerializer(), null);
        this.registerSerializer(core_1.UUID, new DefaultSerializers_1.UuidSerializer(), null);
        this.registerSerializer(core_1.BigDecimal, new DefaultSerializers_1.BigDecimalSerializer(), null);
        this.registerSerializer(BigInt, new DefaultSerializers_1.BigIntSerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.JAVA_ARRAY_SYMBOL, new DefaultSerializers_1.JavaArraySerializer(), null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.COMPACT_SYMBOL, this.compactStreamSerializer, null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.IDENTIFIED_SYMBOL, this.identifiedSerializer, null);
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.PORTABLE_SYMBOL, this.portableSerializer, null);
        if (this.serializationConfig.jsonStringDeserializationPolicy === JsonStringDeserializationPolicy_1.JsonStringDeserializationPolicy.EAGER) {
            this.registerSerializer(SerializationSymbols_1.SerializationSymbols.JSON_SYMBOL, new DefaultSerializers_1.JsonSerializer(), null);
        }
        else {
            this.registerSerializer(SerializationSymbols_1.SerializationSymbols.JSON_SYMBOL, new DefaultSerializers_1.HazelcastJsonValueSerializer(), null);
        }
    }
    createIdentifiedSerializer() {
        const factories = {};
        for (const id in this.serializationConfig.dataSerializableFactories) {
            factories[id] = this.serializationConfig.dataSerializableFactories[id];
        }
        factories[DefaultPredicates_1.PREDICATE_FACTORY_ID] = DefaultPredicates_1.predicateFactory;
        factories[ReliableTopicMessage_1.RELIABLE_TOPIC_MESSAGE_FACTORY_ID] = ReliableTopicMessage_1.reliableTopicMessageFactory;
        factories[ClusterDataFactory_1.CLUSTER_DATA_FACTORY_ID] = ClusterDataFactory_1.clusterDataFactory;
        factories[AggregatorConstants_1.AGGREGATOR_FACTORY_ID] = Aggregator_1.aggregatorFactory;
        factories[RestValue_1.REST_VALUE_FACTORY_ID] = RestValue_1.restValueFactory;
        return new DefaultSerializers_1.IdentifiedDataSerializableSerializer(factories);
    }
    registerCustomSerializers() {
        const customSerializers = this.serializationConfig.customSerializers;
        for (const customSerializer of customSerializers) {
            this.registerSerializer(Symbol.for('!custom' + customSerializer.id), customSerializer, null);
        }
    }
    registerCompactSerializers() {
        const compactSerializers = this.serializationConfig.compact.serializers;
        for (const compactSerializer of compactSerializers) {
            this.compactStreamSerializer.registerSerializer(compactSerializer);
        }
    }
    registerGlobalSerializer() {
        const candidate = this.serializationConfig.globalSerializer;
        if (candidate == null) {
            return;
        }
        this.registerSerializer(SerializationSymbols_1.SerializationSymbols.GLOBAL_SYMBOL, candidate, null);
    }
    static isCustomSerializable(object) {
        const prop = 'hzCustomId';
        return (typeof object[prop] === 'number' && object[prop] >= 1);
    }
    findSerializerByType(typeKey, isArray) {
        if (typeKey === Buffer) {
            typeKey = SerializationSymbols_1.SerializationSymbols.BYTE_SYMBOL;
            isArray = true;
        }
        const serializers = this.typeKeyToSerializersMap.get(typeKey);
        if (serializers === undefined) {
            return null;
        }
        return isArray ? serializers[1] : serializers[0];
    }
    findSerializerById(id) {
        return this.registry[id];
    }
    static calculatePartitionHash(object, strategy) {
        return strategy(object);
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchemaToClass(schema, clazz) {
        this.compactStreamSerializer.registerSchemaToClass(schema, clazz);
    }
}
exports.SerializationServiceV1 = SerializationServiceV1;
//# sourceMappingURL=SerializationService.js.map