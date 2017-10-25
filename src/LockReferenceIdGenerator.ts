import * as Long from 'long';

export class LockReferenceIdGenerator {

    private counter: Long = Long.fromNumber(0);

    getNextReferenceId(): Long {
        this.counter = this.counter.add(1);
        return this.counter;
    }
}
