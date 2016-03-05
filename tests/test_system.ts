/// <reference path="../typings/mocha/mocha.d.ts" />
import { System, makeShip } from '../system';
import { Entity } from '../entity';
import * as ships from '../ships';
import { assert } from 'chai';


describe('System', () => {
    describe('#copy', () => {
        it("shouldn't create copies that share entities", () => {
            var s1 = new System();
            var l1 = [1,2,3];
            s1.addEntity(<Entity><any>l1)
            var s2 = s1.copy()
            l1.push(4);
            assert.equal((<any>s2.entities[0]).length, 3)
        });
    });
    describe('#checkCollisions', () => {
        it("explosions from own missile should damage entities", () => {
            var s1 = new System()
            var ship = makeShip(ships.Gunship, 0, 0, 170);
            ship.shieldsMax = 0;
            s1.addEntity(ship);
            s1.fireMissile(ship, ships.DroneMissile, undefined, '#abcdef')
            s1.tick(.2, function(e){ throw e; });
            s1.fireLaser(ship, '#abcdef')
            s1.tick(1, function(e){ throw e; });
            var EXPLOSION_DAMAGE = 3;
            assert(ship.armor = ship.armorMax - EXPLOSION_DAMAGE);
        });
    });
});
