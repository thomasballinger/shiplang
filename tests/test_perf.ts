var assert = require('chai').assert

import { Updater } from '../updater';
import { Engine } from '../engine';
import { Selection } from '../interfaces';
import { Profile } from '../profile';
import { UserFunctionBodies } from '../userfunctionbodies';
import { PeekEngine, engineFixtures } from './test_engine';

describe('deepcopy', () => {
    describe("copying a world with just the player's js interp", () => {
        it('20 times', () => {
            var world = new PeekEngine(engineFixtures.systems['Sys'],
                                       Profile.newProfile());
            var code = `var a = 1; waitFor(1); a = 2; waitFor(2)`;
            var ufb = new UserFunctionBodies();
            world.addPlayer([code, ufb, undefined]);
            var copies: Engine[] = [];
            for (var i=0; i<20; i++){
                world.tick(0.1, (msg: string)=>{ assert.fail(); });
                copies.push(world.copy())
            }
        });
    });
    describe("copying a world with 2 missiles forked from the player's js interp", () => {
        it('20 times', () => {
            var world = new PeekEngine(engineFixtures.systems['Sys'],
                                       Profile.newProfile());
            var code = `var a = 1;
                        function fly(){
                          waitFor(20);
                        }
                        fireMissile(fly, '#abcdef')
                        fireMissile(fly, '#abcdef')
                        waitFor(20)`;
            var ufb = new UserFunctionBodies();
            world.addPlayer([code, ufb, undefined]);
            world.getPlayer().h = 90
            world.tick(0.1, (msg: string)=>{ assert.fail(); });
            world.getPlayer().h = 0
            world.tick(0.5, (msg: string)=>{ assert.fail(); });
            world.getPlayer().h = 180
            world.tick(0.5, (msg: string)=>{ assert.fail(); });
            assert.equal(world.shipProjectiles.length, 2);

            var copies: Engine[] = [];
            for (var i=0; i<20; i++){
                world.tick(0.1, (msg: string)=>{ assert.fail(); });
                copies.push(world.copy())
            }
            assert.equal(world.shipProjectiles.length, 2);
        });
    });
});
