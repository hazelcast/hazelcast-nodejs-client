/**
 * Defines an assortment of transformations which can be applied to
 * {@link BitmapIndexOptions.uniqueKey unique key} values.
 */
export declare enum UniqueKeyTransformation {
    /**
     * Extracted unique key value is interpreted as an object value.
     * Non-negative unique ID is assigned to every distinct object value.
     */
    OBJECT = 0,
    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary) and unique non-negative ID is assigned to every
     * distinct value.
     */
    LONG = 1,
    /**
     * Extracted unique key value is interpreted as a whole integer value of
     * byte, short, int or long type. The extracted value is upcasted to
     * long (if necessary), and the resulting value is used directly as an ID.
     */
    RAW = 2
}
export declare type UniqueKeyTransformationStrings = keyof typeof UniqueKeyTransformation;
/**
 * Configures indexing options specific to bitmap indexes.
 */
export interface BitmapIndexOptions {
    /**
     * Unique key attribute configured in this index config.
     * Defaults to `__key`. The unique key attribute is used as a source
     * of values which uniquely identify each entry being inserted into an index.
     */
    uniqueKey?: string;
    /**
     * Unique key transformation configured in this index. The transformation is
     * applied to every value extracted from unique key attribute. Defaults
     * to `OBJECT`. Available values are `OBJECT`, `LONG`, and `RAW`.
     */
    uniqueKeyTransformation?: UniqueKeyTransformationStrings;
}
