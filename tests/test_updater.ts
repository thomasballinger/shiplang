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

class PeekEngine extends Engine{
    tick(dt: number, onError: (err: string)=>void){
        if (PeekEngine.preTick){
            PeekEngine.preTick();
        }
        super.tick(dt, onError);
        if (PeekEngine.postTick){
            PeekEngine.postTick();
        }
    }
    static preTick: ()=>void;
    static postTick: ()=>void;
}


var fixtures = createObjects(loadData(`
system Sys
	pos 0 0
	government Trader
`.replace(/    /g, '\t')));
//console.log('fixtures:', fixtures);

/** Returns updater and code update function */
function buildUpdater(): [Updater, (code: string)=>void]{
    var codeToLoad = '';
    var updater = new Updater(new PeekEngine(fixtures.systems['Sys'],
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
    /** This tests assumes userFunctionBodies are getting marked as accessed correctly
     * during the reset tick
     */
    describe('#resetFromSave', () => {
        it('restores controls', () => {
            var [updater, updateCode] = buildUpdater();
            updateCode('function foo(){ return 1; }');
            updater.tick(0.01)

            updater.controls.pressed[90] = true;
            (<FakeUserFunctionBodies>updater.userFunctionBodies).pretendFunctionBodyWasAccessed('foo');
            updater.tick(0.03);

            updater.controls.pressed[90] = false;
            updater.tick(0.05);

            updateCode('function foo(){ return 2; }');
            (<FakeUserFunctionBodies>updater.userFunctionBodies).pretendFunctionBodyWasAccessed('foo');
            PeekEngine.preTick = function(){
                assert.equal(updater.controls.pressed[90], true)
            }
            updater.tick(0.07);
            PeekEngine.preTick = undefined;
            assert.equal(updater.world.gameTime, 0.08);

            // check that control state reverts after a tick
            assert.notEqual(updater.controls.pressed[90], true)

            // Let's do it again to make sure controls are saved
            // correctly after a controls restore
            updater.tick(0.09);
            updateCode('function foo(){ return 3; }');
            PeekEngine.preTick = function(){
                // key is pressed during controls
                assert.equal(updater.controls.pressed[90], true)
            }
            updater.tick(0.11)
            PeekEngine.preTick = undefined;
            assert.equal(updater.world.gameTime, 0.12);
            // check that control state reverts after a tick
            assert.notEqual(updater.controls.pressed[90], true)
        });
    });
});
