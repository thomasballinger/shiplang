/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Updater } from '../updater';
import { Engine } from '../engine';
import { Selection } from '../interfaces';
import { Profile } from '../profile';
import { UserFunctionBodies } from '../userfunctionbodies';
import { PeekEngine, engineFixtures } from './test_engine';

class FakeUserFunctionBodies extends UserFunctionBodies{
    /**  */
    pretendFunctionBodyWasAccessed(name: string){
        this.accessedThisTick[name] = true;
    }
}


/** Returns updater and code update function */
function buildUpdater(): [Updater, (code: string)=>void]{
    var codeToLoad = '';
    var updater = new Updater(new PeekEngine(engineFixtures.systems['Sys'],
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

        /** looks up variable in current scope of the player's interpreter */
        function playerScopeLookup(updater: Updater, name: string): any{
            return (<any>updater.world.getPlayer().context).interpreter.getValueFromScope(name).data;
        }
        function saveScopeLookup(updater: Updater, name: string, saveName: string){
            return (<any>updater.userFunctionBodies.saves[saveName][1].getPlayer()
                    .context).interpreter.getValueFromScope(name).data
        }

        it('restores global script state if in save the script has not been started', () => {
            var [updater, updateCode] = buildUpdater();
            // the waitFor is important because if a script finishes its interpreter
            // disappears and we can no longer inspect its global scope
            updateCode('var a = 1; function foo(){ a += 1; return 1; }; foo(); waitFor(1)');
            updater.tick(0.01);
            assert.equal(playerScopeLookup(updater, 'a'), 2);
            updateCode('var a = 1; function foo(){ a += 1; return 2; }; foo(); waitFor(1)');
            updater.tick(0.03);
            assert.equal(playerScopeLookup(updater, 'a'), 2);
        });
        it('restores global script state if script has already been started', () => {
            var [updater, updateCode] = buildUpdater();
            updateCode('var a = 1; waitFor(1); function foo(){ a += 1; return 1; }; foo(); waitFor(1)');
            console.log('--- ticking original');
            updater.tick(.1);
            assert.equal(playerScopeLookup(updater, 'a'), 1);
            console.log('--- ticking original');
            updater.tick(1.2);
            assert.equal(playerScopeLookup(updater, 'a'), 2);
            updateCode('var a = 1; waitFor(1); function foo(){ a += 1; return 2; }; foo(); waitFor(1)');
            console.log('--- ticking after rewind');
            updater.tick(1.2);
            assert.equal(playerScopeLookup(updater, 'a'), 2);
        });
        // TODO problem with current rewind scheme: will the world clock keep ticking forward on rewinds?
        /** Repo of a bug with missile firing */
        it('keeps saves safe from corruption', () => {
            var [updater, updateCode] = buildUpdater();
            updateCode('var a = 1; waitFor(1); function foo(){ 1; }; foo(); waitFor(1); a++; waitFor(1)');
            updater.tick(.1);
            assert.equal(Object.keys(updater.userFunctionBodies.saves).length, 0);
            updater.tick(1.2);
            assert.equal(Object.keys(updater.userFunctionBodies.saves).length, 1);
            assert.equal(playerScopeLookup(updater, 'a'), 1);
            assert.equal(saveScopeLookup(updater, 'a', 'foo'), 1);
            updater.tick(2);
            assert.equal(playerScopeLookup(updater, 'a'), 2);
            assert.equal(saveScopeLookup(updater, 'a', 'foo'), 1);
        });
    });
});
