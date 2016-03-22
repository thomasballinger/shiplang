/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Updater } from '../updater';
import { Engine } from '../engine';
import { System, universe, createObjects } from '../universe';
import { Selection } from '../interfaces';
import { Profile } from '../profile';
import { loadData } from '../dataload';
import { UserFunctionBodies } from '../userfunctionbodies';

class FakeUserFunctionBodies extends UserFunctionBodies{
    /**  */
    pretendFunctionBodyWasAccessed(name: string){
        this.accessedThisTick[name] = true;
    }
}


var fixtures = createObjects(loadData(`
system Sys
	pos 0 0
	government Trader
`.replace(/    /g, '\t')));
console.log('fixtures:', fixtures);

/** Returns updater and code update function */
function buildUpdater(): [Updater, (code: string)=>void]{
    var codeToLoad = '';
    var updater = new Updater(new Engine(fixtures.systems['Sys'],
                                         Profile.newProfile()),
                              ()=>{ return codeToLoad; },
                              true);
    updater.userFunctionBodies = new FakeUserFunctionBodies();
    return [updater, function updateCode(code: string){
        codeToLoad = code;
        updater.notifyOfCodeChange();
    }];

}


describe('Updater', () => {
    it("Can be constructed too much mocking", () => {
        var [updater, _] = buildUpdater();
    });
    describe('detects when reset or restart needed', () => {
        it("Doesn't reset when an unrun function changes", () => {
            var [updater, updateCode] = buildUpdater();
            updateCode('function foo(){ return 1; };');
            updater.tick(0.01)
            updateCode('function foo(){ return 2; };');
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.04);
        });
        it("Resets from beginning when a new function is added", () => {
            var [updater, updateCode] = buildUpdater();
            updater.userFunctionBodies = new FakeUserFunctionBodies();
            updateCode('function foo(){ return 1; };');
            updater.tick(0.01)
            updateCode('function foo(){ return 2; }; function bar(){ return 3; }');
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.03);
        })
        it("Resets to previous state when a called function changes", () => {
            var [updater, updateCode] = buildUpdater();
            updateCode('function foo(){ return 1; };');
            (<FakeUserFunctionBodies>updater.userFunctionBodies).pretendFunctionBodyWasAccessed('foo');
            updater.tick(0.01)
            updateCode('function foo(){ return 2; }');
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.03);
        });
    });
    describe('#resetFromSave', () => {
    });
});
