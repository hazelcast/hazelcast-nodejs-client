/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assertString} from '../util/Util';

/**
 * Big is a wrapper for BigDecimal values. You can use this class to store
 * and retrieve BigDecimal values or to query a data structure.
 */
export class BigDecimal {

    /** @internal */
    private constructor(readonly bigintValue: BigInt, readonly scale: number) {
    }

    /** @internal */
    private static parseExp(input: string, offset: number, len: number): number {
        let exp = 0;
        offset++;
        let c = input[offset];
        len--;
        const negexp = (c === '-');
        if (negexp || c === '+') {
            offset++;
            c = input[offset];
            len--;
        }
        if (len <= 0) {
            throw new RangeError('No exponent digits');
        }
        while (len > 10 && c === '0') {
            offset++;
            c = input[offset];
            len--;
        }
        if (len > 10) {
            throw new RangeError('Too many nonzero exponent digits');
        }
        for (; ; len--) {
            let v: number;
            if (c >= '0' && c <= '9') {
                v = +c;
            } else {
                throw new RangeError('Not a digit.');
            }
            exp = exp * 10 + v;
            if (len === 1) {
                break;
            }
            offset++;
            c = input[offset];
        }
        if (negexp) {
            exp = -exp;
        }
        return exp;
    }

    /** @internal */
    private static adjustScale(scl: number, exp: number): number {
        const adjustedScale = scl - exp;
        if (adjustedScale > Number.MAX_SAFE_INTEGER || adjustedScale < Number.MIN_SAFE_INTEGER) {
            throw new RangeError('Scale out of range.');
        }
        scl = adjustedScale;
        return scl;
    }

    /** @internal */
    static _new(bigDecimalString: string): BigDecimal {
        assertString(bigDecimalString);
        let offset = 0;
        let len = bigDecimalString.length;
        let precision = 0;
        let scale = 0;
        let bigIntValue: BigInt | null = null;

        let isneg = false;
        if (bigDecimalString[offset] === '-') {
            isneg = true;
            offset++;
            len--;
        } else if (bigDecimalString[offset] === '+') {
            offset++;
            len--;
        }

        let dot = false;
        let exp = 0;
        let c: string;
        let idx = 0;
        const coeff = [];
        for (; len > 0; offset++, len--) {
            c = bigDecimalString[offset];
            if (c >= '0' && c <= '9') {
                if (c === '0') {
                    if (precision === 0) {
                        coeff[idx] = c;
                        precision = 1;
                    } else if (idx !== 0) {
                        coeff[idx++] = c;
                        precision++;
                    }
                } else {
                    if (precision !== 1 || idx !== 0) {
                        precision++;
                    }
                    coeff[idx++] = c;
                }
                if (dot) {
                    scale++;
                }
                continue;
            }
            if (c === '.') {
                if (dot) {
                    throw new RangeError('String contains more than one decimal point.');
                }
                dot = true;
                continue;
            }
            if ((c !== 'e') && (c !== 'E')) {
                throw new RangeError('String is missing "e" notation exponential mark.');
            }
            exp = BigDecimal.parseExp(bigDecimalString, offset, len);
            break;
        }
        if (precision === 0) {
            throw new RangeError('No digits found.');
        }
        if (exp !== 0) {
            scale = BigDecimal.adjustScale(scale, exp);
        }
        const stringValue = coeff.join('');
        if (isneg) {
            bigIntValue = BigInt('-' + stringValue);
        } else {
            bigIntValue = BigInt(stringValue);
        }
        return new BigDecimal(bigIntValue, scale);
    }


    /** @internal */
    private static bigIntAbs(val: BigInt) {
        if (val < BigInt(0)) {
            return val.valueOf() * BigInt(-1);
        } else {
            return val;
        }
    }

    /** @internal */
    private signum(): number {
        return this.bigintValue > BigInt(0) ? 1 : (this.bigintValue < BigInt(0) ? -1 : 0);
    }

    /**
     * Returns unaltered string that was used to create this object.
     * @return original string
     */
    toString(): string {
        if (this.scale === 0) {
            return this.bigintValue.toString();
        }
        if (this.scale < 0) {
            if (this.signum() === 0) {
                return '0';
            }
            const trailingZeros = -this.scale;
            let buf = '';
            buf += this.bigintValue.toString();
            for (let i = 0; i < trailingZeros; i++) {
                buf += '0';
            }
            return buf;
        }
        const str = BigDecimal.bigIntAbs(this.bigintValue).toString();
        return BigDecimal.getValueString(this.signum(), str, this.scale);
    }

    /** @internal */
    private static getValueString(signum: number, intString: string, scale: number): string {
        /* Insert decimal point */
        let buf = '';
        const insertionPoint = intString.length - scale;
        if (insertionPoint === 0) { /* Point goes right before intVal */
            return (signum < 0 ? '-0.' : '0.') + intString;
        } else if (insertionPoint > 0) { /* Point goes inside intVal */
            buf = intString.slice(0, insertionPoint) + '.' + intString.slice(insertionPoint);
            if (signum < 0) {
                buf = '-' + buf;
            }
        } else { /* We must insert zeros between point and intVal */
            buf += signum < 0 ? '-0.' : '0.';
            for (let i = 0; i < -insertionPoint; i++) {
                buf += '0';
            }
            buf += intString;
        }
        return buf.toString();
    }

}

interface BigInterface {
    (decimalString: string): BigDecimal;

    new(decimalString: string): BigDecimal;
}

function _Big(decimalString: string): BigDecimal {
    return BigDecimal._new(decimalString);
}

/**
 * Constructor function for {@link BigDecimal}. Can be invoked with new or without new.
 *
 * @param decimalString a non-null BigDecimal string
 */
export const Big: BigInterface = <BigInterface>_Big;
