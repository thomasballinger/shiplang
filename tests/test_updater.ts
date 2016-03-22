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

        // TODO allow an unbound InputHandler object
        var div = document.createElement("div");
        div.id = 'asdf'
        document.body.appendChild(div);

        var codeToLoad = '';
        var updater = new Updater(new Engine(fixtures.systems['sys'], Profile.newProfile()),
                                  ()=>{ return codeToLoad; },
                                  (msg: string)=>{},
                                  ()=>{},
                                  (msg: string)=>{},
                                  'asdf',
                                  'javascript',
                                  ()=>{},
                                  (id: string, selections: Selection[])=>{},
                                  true,
                                  (e: any)=>{});

    });
    describe('#resetFromSave', () => {
        it("Can restore a saved state", () => {
        });
        it("Can reset to original state", () => {
        });
    });
});
