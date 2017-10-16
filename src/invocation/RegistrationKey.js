"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RegistrationKey = /** @class */ (function () {
    function RegistrationKey(regId, encoder, decoder, handler) {
        this.userRegistrationId = regId;
        this.handler = handler;
        this.encoder = encoder;
        this.decoder = decoder;
    }
    RegistrationKey.prototype.getEncoder = function () {
        return this.encoder;
    };
    RegistrationKey.prototype.setEncoder = function (encoder) {
        this.encoder = encoder;
    };
    RegistrationKey.prototype.getDecoder = function () {
        return this.decoder;
    };
    RegistrationKey.prototype.setDecoder = function (decoder) {
        this.decoder = decoder;
    };
    RegistrationKey.prototype.getHandler = function () {
        return this.handler;
    };
    RegistrationKey.prototype.setHandler = function (handler) {
        this.handler = handler;
    };
    return RegistrationKey;
}());
exports.RegistrationKey = RegistrationKey;
