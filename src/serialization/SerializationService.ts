/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {Data, DataOutput, DataInput} from './Data';
import {HeapData, DATA_OFFSET} from './HeapData';
import {SerializationConfig} from '../config/SerializationConfig';
import {ObjectDataOutput, ObjectDataInput, PositionalObjectDataOutput} from './ObjectData';
import {
    StringSerializer, BooleanSerializer, DoubleSerializer, NullSerializer,
    ShortSerializer, IntegerSerializer, LongSerializer, FloatSerializer, BooleanArraySerializer, ShortArraySerializer,
    IntegerArraySerializer, LongArraySerializer, DoubleArraySerializer, StringArraySerializer,
    IdentifiedDataSerializableSerializer, FloatArraySerializer, JsonSerializer, ByteSerializer, CharSerializer,
    ByteArraySerializer, CharArraySerializer, DateSerializer, JavaClassSerializer
} from './DefaultSerializer';
import * as Util from '../Util';
import {PortableSerializer} from './portable/PortableSerializer';
import {IdentifiedDataSerializableFactory} from './Serializable';
import * as DefaultPredicates from './DefaultPredicates';
import {PredicateFactory, PREDICATE_FACTORY_ID} from './PredicateFactory';
import {RELIABLE_TOPIC_MESSAGE_FACTORY_ID, ReliableTopicMessageFactory} from '../proxy/topic/RawTopicMessage';
import {ClusterDataFactoryHelper} from '../ClusterDataFactoryHelper';
import {ClusterDataFactory} from '../ClusterDataFactory';
import {AggregatorFactory} from '../aggregation/AggregatorFactory';

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

export class SerializationServiceV1 implements SerializationService {

    private registry: {[id: number]: Serializer};
    private serializerNameToId: {[name: string]: number};
    private numberType: string;
    private serializationConfig: SerializationConfig;

    constructor(serializationConfig: SerializationConfig) {
        this.serializationConfig = serializationConfig;
        this.registry = {};
        this.serializerNameToId = {};
        this.registerDefaultSerializers();
        this.registerCustomSerializers();
        this.registerGlobalSerializer();
    }

    private isData(object: any): boolean {
        if (object instanceof HeapData ) {
            return true;
        } else {
            return false;
        }
    }

    toData(object: any, partitioningStrategy: any = this.defaultPartitionStrategy): Data {
        if (this.isData(object)) {
            return <Data>object;
        }
        var dataOutput: DataOutput = new PositionalObjectDataOutput(1, this, this.serializationConfig.isBigEndian);
        var serializer = this.findSerializerFor(object);
        //Check if object is partition aware
        if (object != null && object.getPartitionKey) {
            var partitionKey = object.getPartitionKey();
            var serializedPartitionKey = this.toData(partitionKey);
            dataOutput.writeIntBE(this.calculatePartitionHash(serializedPartitionKey, partitioningStrategy));
        } else {
            dataOutput.writeIntBE(this.calculatePartitionHash(object, partitioningStrategy));
        }
        dataOutput.writeIntBE(serializer.getId());
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
        var serializer = this.findSerializerById(data.getType());
        var dataInput = new ObjectDataInput(data.toBuffer(), DATA_OFFSET, this, this.serializationConfig.isBigEndian);
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
            serializer = this.findSerializerByName('!json', false);
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
        if (this.isPortableSerializable(obj)) {
            return this.findSerializerByName('!portable', false);
        }
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

    protected isPortableSerializable(obj: any): boolean {
        return ( obj.readPortable && obj.writePortable && obj.getFactoryId && obj.getClassId);
    }

    protected registerDefaultSerializers() {
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
        this.registerIdentifiedFactories();
        this.registerSerializer('!json', new JsonSerializer());
        this.registerSerializer(
            '!portable',
            new PortableSerializer(this, this.serializationConfig)
        );
    }

    protected registerIdentifiedFactories() {
        var factories: {[id: number]: IdentifiedDataSerializableFactory} = {};
        for (var id in this.serializationConfig.dataSerializableFactories) {
            factories[id] = this.serializationConfig.dataSerializableFactories[id];
        }
        let factoryConfigs = this.serializationConfig.dataSerializableFactoryConfigs;
        for (let id in factoryConfigs) {
            let path = factoryConfigs[id].path;
            let exportedName = factoryConfigs[id].exportedName;
            let factoryConstructor = Util.loadNameFromPath(path, exportedName);
            factories[id] = new factoryConstructor();
        }
        factories[PREDICATE_FACTORY_ID] = new PredicateFactory(DefaultPredicates);
        factories[RELIABLE_TOPIC_MESSAGE_FACTORY_ID] = new ReliableTopicMessageFactory();
        factories[ClusterDataFactoryHelper.FACTORY_ID] = new ClusterDataFactory();
        factories[AggregatorFactory.FACTORY_ID] = new AggregatorFactory();
        this.registerSerializer('identified', new IdentifiedDataSerializableSerializer(factories));
    }

    protected registerCustomSerializers() {
        let customSerializersArray: any[] = this.serializationConfig.customSerializers;
        var self = this;
        customSerializersArray.forEach(function(candidate) {
            self.assertValidCustomSerializer(candidate);
            self.registerSerializer('!custom' + candidate.getId(), candidate);
        });
        let customSerializerConfigs = this.serializationConfig.customSerializerConfigs;
        for (let typeId in customSerializerConfigs) {
            let serializerConfig = customSerializerConfigs[typeId];
            let customSerializer = new (Util.loadNameFromPath(serializerConfig.path, serializerConfig.exportedName))();
            this.registerSerializer('!custom' + typeId, customSerializer);
        }
    }

    protected registerGlobalSerializer() {
        let candidate: any = null;
        if (this.serializationConfig.globalSerializerConfig != null) {
            let exportedName = this.serializationConfig.globalSerializerConfig.exportedName;
            let path = this.serializationConfig.globalSerializerConfig.path;
            let serializerFactory = Util.loadNameFromPath(path, exportedName);
            candidate = new serializerFactory();
        }
        if (candidate == null) {
            candidate = this.serializationConfig.globalSerializer;
        }
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
            convertedName = this.serializationConfig.defaultNumberType;
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
