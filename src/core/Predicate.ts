import {IdentifiedDataSerializable} from '../serialization/Serializable';
export interface Predicate<K, V> extends IdentifiedDataSerializable {
    apply(key: K, value: V): boolean;
}
