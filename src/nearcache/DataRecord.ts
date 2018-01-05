import {Data} from '../serialization/Data';
import * as Long from 'long';
import {UUID} from '../core/UUID';

export class DataRecord {
    static readonly NOT_RESERVED = Long.NEG_ONE;
    static readonly RESERVED = Long.fromNumber(-2);
    static readonly READ_PERMITTED = Long.fromNumber(-3);

    key: Data;
    value: Data | any;
    private creationTime: number;
    private expirationTime: number;
    private lastAccessTime: number;
    private accessHit: number;
    private invalidationSequence: Long;
    private uuid: UUID;
    private status: Long;
    private ttl: number;

    constructor(key: Data, value: Data | any, creationTime?: number, ttl?: number) {
        this.key = key;
        this.value = value;
        this.ttl = ttl;
        if (creationTime) {
            this.creationTime = creationTime;
        } else {
            this.creationTime = new Date().getTime();
        }
        if (ttl) {
            this.expirationTime = this.creationTime + ttl * 1000;
        } else {
            this.expirationTime = undefined;
        }
        this.lastAccessTime = this.creationTime;
        this.accessHit = 0;
        this.invalidationSequence = Long.fromNumber(0);
        this.uuid = null;
        this.status = DataRecord.READ_PERMITTED;
    }

    public static lruComp(x: DataRecord, y: DataRecord) {
        return x.lastAccessTime - y.lastAccessTime;
    }

    public static lfuComp(x: DataRecord, y: DataRecord) {
        return x.accessHit - y.accessHit;
    }

    public static randomComp(x: DataRecord, y: DataRecord) {
        return Math.random() - 0.5;
    }

    isExpired(maxIdleSeconds: number) {
        var now = new Date().getTime();
        if ((this.expirationTime > 0 && this.expirationTime < now) ||
            (maxIdleSeconds > 0 && this.lastAccessTime + maxIdleSeconds * 1000 < now)) {
            return true;
        } else {
            return false;
        }
    }

    setAccessTime(): void {
        this.lastAccessTime = new Date().getTime();
    }

    hitRecord(): void {
        this.accessHit++;
    }

    getInvalidationSequence(): Long {
        return this.invalidationSequence;
    }

    setInvalidationSequence(sequence: Long): void {
        this.invalidationSequence = sequence;
    }

    hasSameUuid(uuid: UUID): boolean {
        return uuid != null && this.uuid != null && this.uuid.equals(uuid);
    }

    setUuid(uuid: UUID): void {
        this.uuid = uuid;
    }

    casStatus(expected: Long, update: Long): boolean {
        if (expected.equals(this.status)) {
            this.status = update;
            return true;
        }
        return false;
    }

    getStatus(): Long {
        return this.status;
    }

    setCreationTime(creationTime?: number): void {
        if (creationTime) {
            this.creationTime = creationTime;
        } else {
            this.creationTime = new Date().getTime();
        }
        if (this.ttl) {
            this.expirationTime = this.creationTime + this.ttl * 1000;
        } else {
            this.expirationTime = undefined;
        }
    }
}
