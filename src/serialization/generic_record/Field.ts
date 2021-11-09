import {FieldKind} from './FieldKind';
import * as Long from 'long';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Field<T> {
    kind: FieldKind
}

export const string: Field<string> = {
    kind: FieldKind.STRING
};

export const int: Field<number> = {
    kind: FieldKind.INT
};

export const long: Field<Long> = {
    kind: FieldKind.LONG
};

export const float: Field<number> = {
    kind: FieldKind.FLOAT
};

export const double: Field<number> = {
    kind: FieldKind.DOUBLE
};
