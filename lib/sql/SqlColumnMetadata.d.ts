/**
  SqlColumnType represents the datatype of a {@link SqlColumnMetadata}.
 */
export declare enum SqlColumnType {
    /** VARCHAR type, represented by `string`. */
    VARCHAR = 0,
    /** BOOLEAN type, represented by `boolean`. */
    BOOLEAN = 1,
    /** TINYINT type, represented by `number`. */
    TINYINT = 2,
    /** SMALLINT type, represented by `number`. */
    SMALLINT = 3,
    /** INTEGER type, represented by `number`. */
    INTEGER = 4,
    /** BIGINT type, represented by [long](https://www.npmjs.com/package/long). */
    BIGINT = 5,
    /** DECIMAL type, represented by {@link BigDecimal}. */
    DECIMAL = 6,
    /** REAL type, represented by `number`. */
    REAL = 7,
    /** DOUBLE type, represented by `number`. */
    DOUBLE = 8,
    /** DATE type, represented by {@link LocalDate}. */
    DATE = 9,
    /** TIME type, represented by {@link LocalTime}. */
    TIME = 10,
    /** TIMESTAMP type, represented by {@link LocalDateTime}. */
    TIMESTAMP = 11,
    /** TIMESTAMP_WITH_TIME_ZONE type, represented by {@link OffsetDateTime}. */
    TIMESTAMP_WITH_TIME_ZONE = 12,
    /** OBJECT type, could be represented by any class. */
    OBJECT = 13,
    /**
     * The type of the generic SQL `NULL` literal.
     * The only valid value of `NULL` type is `null`.
     */
    NULL = 14,
    /** JSON type, represented by {@link HazelcastJsonValue} and JS objects */
    JSON = 15
}
/**
 * Represents column metadata for SQL result.
 */
export interface SqlColumnMetadata {
    /** Column name. */
    name: string;
    /** Column type. */
    type: SqlColumnType;
    /** Column nullability. If true, the column values can be null. */
    nullable: boolean;
}
