import {DefaultCompactWriter} from '../compact/DefaultCompactWriter';
import {GenericRecord} from './GenericRecord';

export interface FieldKindBasedOperations {
    writeFieldFromRecordToWriter(writer: DefaultCompactWriter, genericRecord: GenericRecord, fieldName: string) : void;
    readObject(genericRecord: GenericRecord, fieldName: string) : any;
    kindSizeInBytes(): number;
    readIndexed(record: GenericRecord, fieldName: string, index: number): any;
    readGenericRecordOrPrimitive(genericRecord: GenericRecord, fieldName: string): any;
}
