import {FieldKind} from './FieldKind';

export type FieldBuilder<T> = ((value: T) => Field<T>);

export interface Field<T> {
    kind: FieldKind;
    value: T;
}

export const stringField : FieldBuilder<string>  = (value: string) => {
    return {
        kind: FieldKind.STRING,
        value
    };
};
