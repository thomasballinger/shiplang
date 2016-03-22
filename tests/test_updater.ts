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


describe('Updater', () => {
    it("Can be constructed too much mocking", () => {
        var codeToLoad = '';
        var updater = new Updater(new Engine(fixtures.systems['Sys'],
                                             Profile.newProfile()),
                                  ()=>{ return codeToLoad; },
                                  true);

    });
    describe('detects when reset or restart needed', () => {
        it("doesn't reset when an unrun function changes", () => {
            var codeToLoad = '';
            var updater = new Updater(new Engine(fixtures.systems['Sys'],
                                                 Profile.newProfile()),
                                      ()=>{ return codeToLoad; },
                                      true);
            updater.userFunctionBodies = new FakeUserFunctionBodies();
            codeToLoad = 'function foo(){ return 1; };';
            updater.notifyOfCodeChange();
            updater.tick(0.01)

            updater.tick(0.1);
            codeToLoad = 'function foo(){ return 2; };';
            updater.notifyOfCodeChange();
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.14);
        });
        it("Resets from beginning when a new function is added", () => {
            var codeToLoad = '';
            var updater = new Updater(new Engine(fixtures.systems['Sys'],
                                                 Profile.newProfile()),
                                      ()=>{ return codeToLoad; },
                                      true);
            updater.userFunctionBodies = new FakeUserFunctionBodies();
            codeToLoad = 'function foo(){ return 1; };';
            updater.notifyOfCodeChange();
            updater.tick(0.01)

            updater.tick(0.1);
            codeToLoad = 'function foo(){ return 2; }; function bar(){ return 3; }';
            updater.notifyOfCodeChange();
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.03);
        })
        it("Resets to previous state when a called function changes", () => {
            var codeToLoad = '';
            var updater = new Updater(new Engine(fixtures.systems['Sys'],
                                                 Profile.newProfile()),
                                      ()=>{ return codeToLoad; },
                                      true);
            var bodies = new FakeUserFunctionBodies();
            updater.userFunctionBodies = bodies;
            codeToLoad = 'function foo(){ return 1; };';
            updater.notifyOfCodeChange();

            bodies.pretendFunctionBodyWasAccessed('foo');
            updater.tick(0.01)

            codeToLoad = 'function foo(){ return 2; }';
            updater.notifyOfCodeChange();
            updater.tick(0.03);
            assert.equal(updater.world.gameTime, 0.03);
        });
    });
    describe('#resetFromSave', () => {
    });
});
