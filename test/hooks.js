const { destroyController, initController } = require('./integration/RC');

exports.mochaHooks = {
    beforeAll(done) {
        initController();
        done();
    },
    afterAll(done) {
        destroyController();
        done();
    }
};
