import {EventEmitter} from 'events';
import HazelcastClient from './HazelcastClient';

export var LifecycleEvent = {
    name: 'lifecycleEvent',
    starting: 'starting',
    started: 'started',
    shuttingDown: 'shuttingDown',
    shutdown: 'shutdown'
};

export class LifecycleService extends EventEmitter {
    private active: boolean;
    private client: HazelcastClient;

    constructor(client: HazelcastClient) {
        super();
        this.setMaxListeners(0);
        this.client = client;
        var listeners: Function[] = [];
        try {
            listeners = client.getConfig().listeners.lifecycle;
            listeners.forEach((listener) => {
                this.on(LifecycleEvent.name, listener);
            });
        } catch (err) {
            //There are no lifecyle listeners in config
        }
        this.emit(LifecycleEvent.name, LifecycleEvent.starting);
    }

    emitLifecycleEvent(state: string): void {
        if ( !LifecycleEvent.hasOwnProperty(state)) {
            throw new Error(state + ' is not a valid lifecycle event');
        }
        if (state === LifecycleEvent.started) {
            this.active = true;
        } else if (state === LifecycleEvent.shuttingDown) {
            this.active = false;
        }
        this.emit(LifecycleEvent.name, state);
    }

    isRunning(): boolean {
        return this.active;
    }
}
