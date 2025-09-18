import { IdentifiedDataSerializableFactory, CustomSerializable } from '../serialization/Serializable';
import { PortableFactory } from '../serialization/Portable';
import { Serializer } from '../serialization/Serializable';
import { JsonStringDeserializationPolicy } from './JsonStringDeserializationPolicy';
import { CompactSerializationConfig } from './CompactSerializationConfig';
/**
 * User-defined serialization config for the client.
 */
export interface SerializationConfig {
    /**
     * Defines how the `number` type is represented on the cluster side. By default, it is serialized as `double`.
     * This option can be one of the following case-insensitive strings.
     * * `byte`(8-bit signed integer)
     * * `short`(16-bit signed integer)
     * * `integer`(32-bit signed integer)
     * * `float`(single-precision 32-bit IEEE 754 floating point)
     * * `double`(double-precision 64-bit IEEE 754 floating point)
     * * `long`(64-bit integer from long.js library)
     *
     * Note:
     * * If you are using `byte`, **for array of numbers** you need to use `Buffer` instead of regular arrays.
     * * If you are using `long`, you need to use Long objects **for array of numbers or a single number**.
     */
    defaultNumberType?: string;
    /**
     * Defines if big-endian is used as the byte order for the serialization. By default, set to `true`.
     */
    isBigEndian?: boolean;
    /**
     * Defines IdentifiedDataSerializableFactory serialization factories.
     */
    dataSerializableFactories?: {
        [id: number]: IdentifiedDataSerializableFactory;
    };
    /**
     * Defines Portable serialization factories.
     */
    portableFactories?: {
        [id: number]: PortableFactory;
    };
    /**
     * Defines portable version number. By default, set to `0`.
     */
    portableVersion?: number;
    /**
     * Defines Custom serializers.
     */
    customSerializers?: Array<Serializer<CustomSerializable>>;
    /**
     * Defines the global serializer. This serializer is registered as a fallback serializer
     * to handle all other objects if a serializer cannot be located for them.
     */
    globalSerializer?: Serializer;
    /**
     * Defines JSON deserialization policy. By default, set to `eager`.
     */
    jsonStringDeserializationPolicy?: JsonStringDeserializationPolicy;
    /**
     * Compact serialization config.
     */
    compact?: CompactSerializationConfig;
}
