/** @ignore */ /** */
import { GenericRecord } from '../generic_record/GenericRecord';
/**
 * Checks that the Compact serializable array items that are written are of
 * a single type.
 */
export declare class SingleTypeCompactArrayItemChecker<T> {
    private clazz;
    check(value: T): void;
}
/**
 * Checks that the Compact serializable GenericRecord array items that are
 * written are of a single schema.
 */
export declare class SingleSchemaCompactArrayItemChecker {
    private schema;
    check(value: GenericRecord): void;
}
