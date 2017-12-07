/* tslint:disable:no-bitwise */
import {UUID} from '../core/UUID';
import * as Long from 'long';

const INT_BOUND = 0xFFFFFFFF;

function randomUInt(): number {
    return Math.floor(Math.random() * INT_BOUND);
}

export class UuidUtil {
    static generate(): UUID {
        let mostS = new Long(randomUInt(), randomUInt(), true);
        let leastS = new Long(randomUInt(), randomUInt(), true);
        return new UUID(mostS, leastS);
    }
}
