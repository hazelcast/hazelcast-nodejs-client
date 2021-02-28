const { destroyConnection } = require('./integration/RC');

exports.mochaHooks = {
    // Destroy connection after all tests to prevent mocha from hanging.
    afterAll(done) {
        destroyConnection();
        done();
    }
};
