/* tslint:disable:no-bitwise */
export class Semaphore {
static SEMAPHORE_INIT = 0x0d01;
static SEMAPHORE_ACQUIRE = 0x0d02;
static SEMAPHORE_AVAILABLEPERMITS = 0x0d03;
static SEMAPHORE_DRAINPERMITS = 0x0d04;
static SEMAPHORE_REDUCEPERMITS = 0x0d05;
static SEMAPHORE_RELEASE = 0x0d06;
static SEMAPHORE_TRYACQUIRE = 0x0d07;
}