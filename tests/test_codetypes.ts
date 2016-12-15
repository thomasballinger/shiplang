/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { SLgetScripts, debugReport } from '../src/scriptenv';
import { SLContext } from '../src/codetypes';
import { Ship } from '../src/entity';


var testCode = `
(defn foo ()
  (define a 1)
  (__debug_report a)
  (define a (+ a 1))
  (__debug_report a)
  (report a))
`;

function runUntilReport(){}

describe('Codetypes', () => {
    describe('#fromFunction', () => {
        it("creates separate environments for each script", () => {
            var scripts = SLgetScripts(testCode);
            var c1 = SLContext.fromFunction(scripts.foo)
            var c2 = SLContext.fromFunction(scripts.foo)
            c1.step(<Ship><any>1)
            assert.equal(debugReport(), 1)
            c2.step(<Ship><any>1)
            assert.equal(debugReport(), 1)
            c1.step(<Ship><any>1)
            assert.equal(debugReport(), 2)
            c2.step(<Ship><any>1)
            assert.equal(debugReport(), 2)
        });
    });
});
