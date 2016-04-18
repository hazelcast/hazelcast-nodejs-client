import {EventEmitter} from 'events';
import HazelcastClient from './HazelcastClient';

/**
 * Lifecycle events.
 */
export var LifecycleEvent = {
    /**
     * events are emitted with this name.
     */
    name: 'lifecycleEvent',
    /**
     * From creation of client to connected state.
     */
    starting: 'starting',
    /**
     * Client is connected to cluster. Ready to use.
     */
    started: 'started',
    /**
     * Disconnect initiated.
     */
    shuttingDown: 'shuttingDown',
    /**
     * Disconnect completed gracefully.
     */
    shutdown: 'shutdown'
};

/**
 * LifecycleService
 */
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

    /**
     * Causes LifecycleService to emit given event to all registered listeners.
     * @param state
     */
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

    /**
     * Returns the active state of the client.
     * @returns {boolean}
     */
    isRunning(): boolean {
        return this.active;
    }
}
