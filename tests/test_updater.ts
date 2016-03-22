/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Updater } from '../updater';
import { Engine } from '../engine';
import { System, universe, createObjects } from '../universe';
import { Selection } from '../interfaces';
import { Profile } from '../profile';
import { loadData } from '../dataload';


var fixtures = createObjects(loadData(`
system Sys
	pos 0 0
	government Trader
`.replace(/    /g, '\t')));


describe('Updater', () => {
    it("Can be constructed too much mocking", () => {
        var codeToLoad = '';
        var updater = new Updater(new Engine(fixtures.systems['sys'],
                                             Profile.newProfile()),
                                  ()=>{ return codeToLoad; },
                                  true);

    });
    describe('#resetFromSave', () => {
        it("Can restore a saved state", () => {
            var codeToLoad = '';
            var updater = new Updater(new Engine(fixtures.systems['sys'],
                                                 Profile.newProfile()),
                                      ()=>{ return codeToLoad; },
                                      true);

            updater.tick(0.1);
            //TODO first try to test this with no script running
            //my making a mock userFunctionBodies maybe
        });
        it("Can reset to original state", () => {
        });
    });
});
