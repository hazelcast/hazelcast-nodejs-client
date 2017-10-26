import HazelcastClient from './HazelcastClient';
import * as Config from './Config';
import {ClientInfo} from './ClientInfo';
import {IMap} from './proxy/IMap';
import * as Predicates from './core/Predicate';
import Address = require('./Address');
import TopicOverloadPolicy = require('./proxy/topic/TopicOverloadPolicy');
import * as HazelcastErrors from './HazelcastError';

export {
    HazelcastClient as Client,
    Config,
    ClientInfo,
    IMap,
    Address,
    Predicates,
    TopicOverloadPolicy,
    HazelcastErrors
};
