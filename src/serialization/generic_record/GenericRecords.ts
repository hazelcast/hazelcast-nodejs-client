import {GenericRecord} from './GenericRecord';
import {CompactGenericRecord} from './CompactGenericRecord';
import {Field} from './Field';

export class GenericRecords {
    static compact<F extends {[name: string]: Field<any>}>(
        fields: F,
        values: {[property in keyof F]: F[property] extends Field<infer T> ? T : any}
    ): GenericRecord {
        return new CompactGenericRecord(fields, values);
    }
}
