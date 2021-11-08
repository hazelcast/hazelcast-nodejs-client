import {ObjectDataInput} from '../ObjectData';

export interface OffsetReader {
    getOffset(input: ObjectDataInput, variableOffsetsPos: number, index: number): number;
}
