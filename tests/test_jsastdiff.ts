/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

var astdiff = require('../jsastdiff');
var acorn = require('acorn');
acorn.walk = require('acorn/dist/walk');

describe('jsastdiff', () => {
    describe('changedNamedFunctions', () => {
        it("should return function bodies", () => {
            var code1 = acorn.parse('function foo(){ 1 + 1 }');
            var code2 = acorn.parse('function foo(){ 2 + 3 }');
            var changed = astdiff.changedNamedFunctions(code1, code2);

            assert.equal(Object.keys(changed).length, 1);
            assert.property(changed, 'foo');
            assert.equal(changed['foo'].type, 'BlockStatement');
        });
    });
});
