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
});
