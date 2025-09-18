/**
 * Using this policy, one can control the
 * deserialization type of the JSON strings.
 */
export declare enum JsonStringDeserializationPolicy {
    /**
     * JSON strings are parsed and returned
     * as JavaScript objects.
     */
    EAGER = "EAGER",
    /**
     * Raw JSON strings are returned around a
     * lightweight {@link HazelcastJsonValue}
     * wrapper.
     */
    NO_DESERIALIZATION = "NO_DESERIALIZATION"
}
