import {HazelcastSerializationError} from '../../core';

export class CompactUtil {
    static toExceptionForUnexpectedNullValueInArray(fieldName: string, methodSuffix: string): HazelcastSerializationError {
        return new HazelcastSerializationError(
            `Error while reading ${fieldName}. null value can not be read via` +
            `getArrayOf${methodSuffix} methods. Use getArrayOf${methodSuffix} instead.`
        );
    }
}
