/* tslint:disable */
export class LockMessageType {
    static LOCK_ISLOCKED = 0x0701;
    static LOCK_ISLOCKEDBYCURRENTTHREAD = 0x0702;
    static LOCK_GETLOCKCOUNT = 0x0703;
    static LOCK_GETREMAININGLEASETIME = 0x0704;
    static LOCK_LOCK = 0x0705;
    static LOCK_UNLOCK = 0x0706;
    static LOCK_FORCEUNLOCK = 0x0707;
    static LOCK_TRYLOCK = 0x0708;
}
