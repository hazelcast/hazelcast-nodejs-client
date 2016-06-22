var expect = require('chai').expect;
var assert = require('chai').assert;
var CD = require('../../../lib/serialization/portable/ClassDefinition').ClassDefinition;
var FD = require('../../../lib/serialization/portable/ClassDefinition').FieldDefinition;
var FT = require('../../../lib/serialization/portable/ClassDefinition').FieldDefinition;

describe('Test.getFieldType()', function(){
    var a = new CD(1,2,3);

    it('firstField should be type of FT.INT.', function(){
        a.addFieldDefinition(new FD(0,'firstField',FT.INT,10,10));
        var type = a.getFieldType('firstField');
        expect(type).equal(FT.INT);
    });

    it('secondField should be type of FT.STRING.', function(){
        a.addFieldDefinition(new FD(1,'secondField',FT.CHAR_ARRAY,11,11));
        var type = a.getFieldType('secondField');
        expect(type).equal(FT.CHAR_ARRAY);
    });

    it('thirdField should be null because we will not add it. (It does not exist.)', function(){
        expect(a.getFieldType.bind(a,'thirdField')).to.throw(Error);
    });

});

describe('Test.hasField()', function(){
    var a;

    beforeEach(function(){
        a = new CD(1,2,3);
    });

    it('field was added so it should be return true.', function(){
        a.addFieldDefinition(new FD(0,'aField',FT.INT,10,10));
        //var res = a.hasField('aField');
        expect(a.hasField('aField')).to.be.true;
    });

    it('field was not added so it should be return false.', function(){
        var res = a.hasField('aField');
        expect(res).to.be.false;
    });

});



describe('Test.getFieldById()', function(){
    var a = new CD(1,2,3);

    before(function(){
        a.addFieldDefinition(new FD(0,'firstField',FT.INT,10,10));
    });

    it('When index is not an integer it should throw an range exception.', function(){
        expect(a.getFieldById.bind(a, 0.3)).to.throw(Error);
    });

    it('When index is negative it should throw an range exception.', function(){
        expect(a.getFieldById.bind(a, -2)).to.throw(Error);
    });

    it('When a field with given index is found.', function(){
        expect(a.getFieldById.bind(a, 0)).to.not.throw(Error);
    });

    it('When index is more than or equal to total number of field it should throw an range exception.', function(){
        expect(a.getFieldById.bind(a, 1)).to.throw(Error);
    });

    /*it('When there is no such field', function(){
       a.addFieldDefinition(new FD(2,'firstField',FT.INT,10,10));
        expect(a.getFieldById.bind(a,1)).not.throw(Error);
    });*/

});

describe('Test.equals()', function(){

    it('When parameter passed is not a ClassDefinitionObject.', function(){
        var a = new CD();
        var b = new FD();
        var res = a.equals(b);
        expect(res).to.equal(false);
    });

    it('When one of the fields (or more) is not matched with the parameter.', function(){
        var a = new CD(1,3,4);
        var b = new CD(1,3,6);
        var res = a.equals(b);
        expect(res).to.equal(false);
    });

    it('When parameter is equal.', function(){
        var a = new CD(1,3,6);
        var b = new CD(1,3,6);
        var res = a.equals(b);
        expect(res).to.equal(true);
    });

});

