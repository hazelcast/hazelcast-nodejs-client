import net from 'node:net';
import { setTimeout } from 'node:timers/promises';

class Protocol {}

async function connect(host, port, signal) {
    while (!signal?.aborted) {
        try {
            return await new Promise((resolve, reject) => {
                const socket = net.createConnection({ host, port, family: 4 }, () => {
                    resolve({ socket, protocol: new Protocol() });
                });

                socket.once('error', (err) => {
                    socket.destroy();
                    reject(err);
                });
            });
        } catch (err) {
            if (signal?.aborted) throw new Error('Aborted');
            await setTimeout(100);
        }
    }
}

async function printWaitingMsg(host, port, signal) {
    try {
        await setTimeout(1000, null, { signal });
        console.log(`Waiting for ${host}:${port} to become available...`);
    } catch (err) {
        if (err.name !== 'AbortError') throw err;
    }
}

async function main() {
    const host = '127.0.0.1';
    const port = 9701;
    const timeoutMs = 120 * 1000;

    const timeoutController = new AbortController();
    const msgController = new AbortController();
    const msgTask = printWaitingMsg(host, port, msgController.signal);
    const timer = globalThis.setTimeout(() => {
        timeoutController.abort();
    }, timeoutMs);

    try {
        const { socket } = await connect(host, port, timeoutController.signal);
        msgController.abort();
        console.log(`OK, ${host}:${port} is up.`);
        socket.end();
        await setTimeout(1000);
    } catch (err) {
        if (timeoutController.signal.aborted) {
            console.log(`FAILED to connect in ${timeoutMs / 1000} seconds.`);
            process.exit(1);
        }
        throw err;
    } finally {
        clearTimeout(timer);
        await msgTask;
    }
}

main();
