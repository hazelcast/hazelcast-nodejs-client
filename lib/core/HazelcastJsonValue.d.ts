/**
 * HazelcastJsonValue is a wrapper for JSON formatted strings. It is preferred
 * to store HazelcastJsonValue instead of Strings for JSON formatted strings.
 * Users can run predicates and use indexes on the attributes of the underlying
 * JSON strings.
 *
 * HazelcastJsonValue is queried using Hazelcast's querying language.
 *
 * In terms of querying, numbers in JSON strings are treated as either
 * Long or Double in the Java side. Strings, booleans and null
 * are treated as their Java counterparts.
 *
 * HazelcastJsonValue keeps given string as it is. Strings are not
 * checked for being valid. Ill-formatted json strings may cause false
 * positive or false negative results in queries.
 *
 * Important note: `null` values are not allowed.
 */
export declare class HazelcastJsonValue {
    private readonly jsonString;
    /**
     * Creates a HazelcastJsonValue from given string.
     * @throws AssertionError if `jsonString` is not a `string`
     * @param jsonString a non-null Json string
     */
    constructor(jsonString: string);
    /**
     * Returns unaltered string that was used to create this object.
     * @return original string
     */
    toString(): string;
}
