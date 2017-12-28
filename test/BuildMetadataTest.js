var BuildMetadata = require('../lib/BuildMetadata').BuildMetadata;
var assert = require('chai').assert;

describe('BuildMetadata', function() {
    it('version calculation test', function() {
        assert.equal(-1, BuildMetadata.calculateVersion(null));
        assert.equal(-1, BuildMetadata.calculateVersion(""));
        assert.equal(-1, BuildMetadata.calculateVersion("a.3.7.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3.a.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3,7.5"));
        assert.equal(-1, BuildMetadata.calculateVersion("3.7,5"));
        assert.equal(-1, BuildMetadata.calculateVersion("10.99.RC1"));

        assert.equal(30700, BuildMetadata.calculateVersion("3.7"));
        assert.equal(30700, BuildMetadata.calculateVersion("3.7-SNAPSHOT"));
        assert.equal(30702, BuildMetadata.calculateVersion("3.7.2"));
        assert.equal(30702, BuildMetadata.calculateVersion("3.7.2-SNAPSHOT"));
        assert.equal(109902, BuildMetadata.calculateVersion("10.99.2-SNAPSHOT"));
        assert.equal(19930, BuildMetadata.calculateVersion("1.99.30"));
        assert.equal(109930, BuildMetadata.calculateVersion("10.99.30-SNAPSHOT"));
        assert.equal(109900, BuildMetadata.calculateVersion("10.99-RC1"));
    });
});
