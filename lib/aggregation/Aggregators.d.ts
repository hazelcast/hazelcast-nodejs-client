/// <reference types="long" />
import { Aggregator } from './Aggregator';
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that counts the input values.
 * Accepts nulls as input values.
 * Aggregation result type `Long`.
 */
export declare function count(attributePath?: string): Aggregator<Long>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export declare function doubleAvg(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Double input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export declare function doubleSum(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
export declare function numberAvg(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `Long`.
 */
export declare function fixedPointSum(attributePath?: string): Aggregator<Long>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts generic Number input values.
 * Aggregation result type is `number`.
 */
export declare function floatingPointSum(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the max of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
export declare function max<R>(attributePath?: string): Aggregator<R>;
/**
 * @param attributePath extracts values from this path if given
 * @param <R> type of the input object.
 * @return an aggregator that calculates the min of the input values.
 * Accepts `null` input values.
 * Aggregation result type is `R`.
 */
export declare function min<R>(attributePath?: string): Aggregator<R>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export declare function integerAvg(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Integer input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
export declare function integerSum(attributePath?: string): Aggregator<Long>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the average of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `number`.
 */
export declare function longAvg(attributePath?: string): Aggregator<number>;
/**
 * @param attributePath extracts values from this path if given
 * @return an aggregator that calculates the sum of the input values.
 * Does NOT accept `null` input values.
 * Accepts only Long input values (primitive and boxed).
 * Aggregation result type is `Long`.
 */
export declare function longSum(attributePath?: string): Aggregator<Long>;
/**
 * @param attributePath extracts values from this path if given.
 * @param <R> type of the return object.
 * @return an aggregator that calculates the distinct set of input values.
 * Accepts null input values.
 * Aggregation result type is a Set of R.
 */
export declare function distinct<R>(attributePath?: string): Aggregator<Set<R>>;
