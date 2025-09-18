import { GenericRecord } from './GenericRecord';
import { Field } from './Fields';
/**
 * The class for creating generic records. This class should not be instantiated directly.
 * Its {@link compact} method creates new compact generic records.
 *
 */
export declare class GenericRecords {
    /**
     * Static constructor method for compact generic records.
     *
     * @param typeName Represents the type of the compact object, included in serialized form
     * @param fields Represents the field schema of the compact
     * @param values Values to use in the generic record. This should be in sync with `fields`
     * @throws TypeError if a value is of wrong type according to `fields`
     * @throws RangeError if a value is out of range of its type
     * @returns A compact generic record
     */
    static compact<F extends {
        [name: string]: Field<any>;
    }>(typeName: string, fields: F, values: {
        [property in keyof F]: F[property] extends Field<infer T> ? T : any;
    }): GenericRecord;
}
