import {DefaultCompactWriter} from '../compact/DefaultCompactWriter';
import {GenericRecord} from './GenericRecord';
import {InternalGenericRecord} from './InternalGenericRecord';

export interface FieldKindBasedOperations {
    writeFieldFromRecordToWriter(writer: DefaultCompactWriter, genericRecord: GenericRecord, fieldName: string) : void;
    readObject(genericRecord: GenericRecord, fieldName: string) : any;
    kindSizeInBytes(): number;
    readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any;
    readGenericRecordOrPrimitive(genericRecord: GenericRecord, fieldName: string): any;
}
