'use strict';
var chai = require('chai');
var assert = chai.assert;

var ai = require('./ai.js');

describe('script running', function(){
  describe('something', function(){
    it('should run a script', function(){
      var e = {};
      var a = 0;
      var scriptStarted = false;
      var scriptFinished = false;
      function waitForA(){ return a === 3; }
      function* script(e){
        scriptStarted = true;
        yield waitForA;
        scriptFinished = true;
      }
      e.script = script;
      ai.runEntityScript(e);
      assert.isTrue(scriptStarted);
      assert.isFalse(scriptFinished);
      assert.isDefined(e.readyCallback);
      assert.isDefined(e.scriptInProgress);

      ai.runEntityScript(e);
      assert.isTrue(scriptStarted);
      assert.isFalse(scriptFinished);
      assert.isDefined(e.readyCallback);
      assert.isDefined(e.scriptInProgress);

      a = 3;
      ai.runEntityScript(e);
      assert.isTrue(scriptFinished);
      assert.strictEqual(e.readyCallback, 'done');
    });
  });
});
