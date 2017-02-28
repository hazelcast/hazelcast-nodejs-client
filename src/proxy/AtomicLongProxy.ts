import * as Promise from 'bluebird';
import * as Long from 'long';
import {IAtomicLong} from './IAtomicLong';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {AtomicLongAddAndGetCodec} from '../codec/AtomicLongAddAndGetCodec';
import {AtomicLongGetCodec} from '../codec/AtomicLongGetCodec';
import {AtomicLongGetAndAddCodec} from '../codec/AtomicLongGetAndAddCodec';
import {AtomicLongDecrementAndGetCodec} from '../codec/AtomicLongDecrementAndGetCodec';
import {AtomicLongSetCodec} from '../codec/AtomicLongSetCodec';
import {AtomicLongCompareAndSetCodec} from '../codec/AtomicLongCompareAndSetCodec';
import {AtomicLongGetAndSetCodec} from '../codec/AtomicLongGetAndSetCodec';
import {AtomicLongIncrementAndGetCodec} from '../codec/AtomicLongIncrementAndGetCodec';
import {AtomicLongGetAndIncrementCodec} from '../codec/AtomicLongGetAndIncrementCodec';

export class AtomicLongProxy extends PartitionSpecificProxy implements IAtomicLong {
    addAndGet(delta: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongAddAndGetCodec, delta);
    }

    compareAndSet(expect: Long|number, update: Long|number): Promise<boolean> {
        return this.encodeInvoke<boolean>(AtomicLongCompareAndSetCodec, expect, update);
    }

    decrementAndGet(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongDecrementAndGetCodec);
    }

    get(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetCodec);
    }

    getAndAdd(delta: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndAddCodec, delta);
    }

    getAndSet(newValue: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndSetCodec, newValue);
    }

    incrementAndGet(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongIncrementAndGetCodec);
    }

    getAndIncrement(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndIncrementCodec);
    }

    set(newValue: Long|number): Promise<void> {
        return this.encodeInvoke<void>(AtomicLongSetCodec, newValue);
    }

}
