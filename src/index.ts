import HazelcastClient from './HazelcastClient';
import * as Config from './Config';
import {ClientInfo} from './ClientInfo';
import {IMap} from './proxy/IMap';
import Address = require('./Address');
import * as Predicates from './core/Predicate';
export {
    HazelcastClient as Client,
    Config,
    ClientInfo,
    IMap,
    Address,
    Predicates
}
