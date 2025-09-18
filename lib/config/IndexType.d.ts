/**
 * Type of the index.
 */
export declare enum IndexType {
    /**
     * Sorted index. Can be used with equality and range predicates.
     */
    SORTED = 0,
    /**
     * Hash index. Can be used with equality predicates.
     */
    HASH = 1,
    /**
     * Bitmap index. Can be used with equality predicates.
     */
    BITMAP = 2
}
export declare type IndexTypeStrings = keyof typeof IndexType;
