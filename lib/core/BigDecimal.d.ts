/**
 * A wrapper for `BigDecimal` values. You can use this class to store and query `BigDecimal` values in distributed objects.
 *
 * A `BigDecimal` consists of an arbitrary precision number {@link unscaledValue} and a {@link scale}.
 * If zero or positive, the scale is the number of digits to the right of the decimal
 * point. If negative, the unscaled value of the number is multiplied
 * by ten to the power of the negation of the scale. The value of the
 * number represented by the `BigDecimal` is therefore
 * <code>(unscaledValue &times; 10<sup>-scale</sup>)</code>.
 */
export declare class BigDecimal {
    /**
     * Unscaled value of this `BigDecimal`. This value is a native JavaScript BigInt object, which is used to store
     * digits of this BigDecimal.
     */
    readonly unscaledValue: bigint;
    /**
     * Scale of this `BigDecimal`. If zero or positive, the scale
     * is the number of digits to the right of the decimal point.
     * If negative, the unscaled value of the number is multiplied
     * by ten to the power of the negation of the scale. For example,
     * a scale of `-3` means the unscaled value is multiplied by `1000`.
     */
    readonly scale: number;
    /**
     * Constructs a `BigDecimal` from a unscaled value and a scale.
     *
     * @param unscaledValue Unscaled value of this `BigDecimal`.
     * This value is a native JavaScript BigInt object, which is used to store
     * digits of this BigDecimal.
     * @param scale Scale of this `BigDecimal`. If zero or positive, the scale
     * is the number of digits to the right of the decimal point.
     * If negative, the unscaled value of the number is multiplied
     * by ten to the power of the negation of the scale. For example,
     * a scale of `-3` means the unscaled value is multiplied by `1000`.
     */
    constructor(unscaledValue: bigint, scale: number);
    /**
     * Translates the string representation of a `BigDecimal`
     * into a `BigDecimal`.  The string representation consists
     * of an optional sign, '+' (<code> '&#92;u002B'</code>) or
     * '-' (<code>'&#92;u002D'</code>), followed by a sequence of
     * zero or more decimal digits ("the integer"), optionally
     * followed by a fraction, optionally followed by an exponent.
     *
     * The fraction consists of a decimal point followed by zero
     * or more decimal digits. The string must contain at least one
     * digit in either the integer or the fraction. The number formed
     * by the sign, the integer and the fraction is referred to as the
     * significand.
     *
     * The exponent consists of the character 'e'
     * (<code>'&#92;u0065'</code>) or 'E' (<code>'&#92;u0045'</code>)
     * followed by one or more decimal digits. The value of the
     * exponent must be a safe integer.
     *
     * The scale of the returned `BigDecimal` will be the
     * number of digits in the fraction, or zero if the string
     * contains no decimal point, subject to adjustment for any
     * exponent; if the string contains an exponent, the exponent is
     * subtracted from the scale. The value of the resulting scale
     * must be a safe integer.
     *
     * ## Examples:
     *
     * The value of the returned `BigDecimal` is equal to
     * <i>significand</i> &times; 10<sup>&nbsp;<i>exponent</i></sup>.
     * For each string on the left, the resulting representation
     * [`BigInt`, `scale`] is shown on the right.
     * <pre>
     * "0"            [0,0]
     * "0.00"         [0,2]
     * "123"          [123,0]
     * "-123"         [-123,0]
     * "1.23E3"       [123,-1]
     * "1.23E+3"      [123,-1]
     * "12.3E+7"      [123,-6]
     * "12.0"         [120,1]
     * "12.3"         [123,1]
     * "0.00123"      [123,5]
     * "-1.23E-12"    [-123,14]
     * "1234.5E-4"    [12345,5]
     * "0E+7"         [0,-7]
     * "-0"           [0,0]
     * </pre>
     *
     * @param value a non-null `BigDecimal` string
     * @throws TypeError if `value` is not a `string`.
     * @throws RangeError if `value` is not a valid representation of a `BigDecimal`.
     */
    static fromString(value: string): BigDecimal;
    /**
     * Returns a string representation of this `BigDecimal`
     * without an exponent field.  For values with a positive scale,
     * the number of digits to the right of the decimal point is used
     * to indicate scale. For values with a zero or negative scale,
     * the resulting string is generated as if the value were
     * converted to a numerically equal value with zero scale and as
     * if all the trailing zeros of the zero scale value were present
     * in the result.
     *
     * The entire string is prefixed by a minus sign character '-'
     * (<code>'&#92;u002D'</code>) if the unscaled value is less than
     * zero. No sign character is prefixed if the unscaled value is
     * zero or positive.
     *
     * @return a string representation of this `BigDecimal`
     * without an exponent field.
     */
    toString(): string;
}
