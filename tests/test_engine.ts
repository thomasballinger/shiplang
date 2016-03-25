/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Engine, makeShipEntity } from '../engine';
import { Entity } from '../entity';
import { System, universe, createObjects } from '../universe';
import { Profile } from '../profile';
import { loadData } from '../dataload';
import { UserFunctionBodies } from '../userfunctionbodies';

export class PeekEngine extends Engine{
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


export var engineFixtures = createObjects(loadData(`
system Sys
	pos 0 0
	government Trader
`.replace(/    /g, '\t')));

describe('Engine', () => {
    describe('#copy', () => {
        it("shouldn't create copies that share entities", () => {
            var s1 = new Engine(undefined, undefined);
            var l1 = [1,2,3];
            s1.addEntity(<Entity><any>l1)
            var s2 = s1.copy()
            l1.push(4);
            assert.equal((<any>s2.entities[0]).length, 3)
        });
        it("should create interpreters without shared state", () => {
            var world = new PeekEngine(engineFixtures.systems['Sys'],
                                       Profile.newProfile());
            var code = `var a = 1; waitFor(1); a = 2; waitFor(2)`;
            var ufb = new UserFunctionBodies();
            world.addPlayer([code, ufb, undefined]);
            world.tick(0.1, (msg: string)=>{ throw Error(msg); });
            assert.equal((<any>world.getPlayer().context).interpreter
                         .getValueFromScope('a').data, 1);
            var copy = world.copy();

            var interp = (<any>world.getPlayer().context).interpreter;
            var copyInterp = (<any>copy.getPlayer().context).interpreter;

            world.tick(1.2, (msg: string)=>{ throw Error(msg); });

            // should be different entities
            (<any>world.getPlayer()).madeUpProperty = 1;
            assert.notProperty((<any>copy.getPlayer()), 'madeUpProperty');

            // should be different contexts
            (<any>world.getPlayer().context).madeUpProperty = 1;
            assert.notProperty((<any>copy.getPlayer().context), 'madeUpProperty');

            // should be different interpreters
            (<any>world.getPlayer().context).interpreter.madeUpProperty = 1;
            assert.notProperty((<any>copy.getPlayer().context).interpreter, 'madeUpProperty');

            // should not share scope data
            assert.equal((<any>world.getPlayer().context).interpreter
                         .getValueFromScope('a').data, 2);
            assert.equal((<any>copy.getPlayer().context).interpreter
                         .getValueFromScope('a').data, 1);
        });
    });
    describe('#checkCollisions', () => {
        it("explosions from own missile should damage entities", () => {
            var s1 = new Engine(undefined, undefined)
            var ship = makeShipEntity(universe.ships['Gunship'], 0, 0, 170);
            ship.shieldsMax = 0;
            s1.addEntity(ship);
            s1.fireMissile(ship, universe.ships['Drone Missile'], undefined, '#abcdef')
            s1.tick(.2, function(e){ throw e; });
            s1.fireLaser(ship, '#abcdef')
            s1.tick(1, function(e){ throw e; });
            var EXPLOSION_DAMAGE = 3;
            assert(ship.armor = ship.armorMax - EXPLOSION_DAMAGE);
        });
    });
});
