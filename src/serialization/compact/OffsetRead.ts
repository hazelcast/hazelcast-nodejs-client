import {ObjectDataInput} from '../ObjectData';

export type OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number) => number;
