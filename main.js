const { Client } = require('.');

(async () => {
    const client = await Client.newHazelcastClient();

    const lock = await client.getCPSubsystem().getLock('my-lock');

    for (let i = 0; i < 3; i++) {
        tryAcquire(lock, i);
    }
})();

async function tryAcquire(lock, i) {
    const fence = await lock.lock();
    console.log('acquired', i, fence);
    setTimeout(() => {
        lock.unlock(fence);
    }, 1000);
}
