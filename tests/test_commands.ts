/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { universe } from '../src/universe';
import { Engine, makeShipEntity } from '../src/engine';
import {setCurrentEntity, setGameTime, setGameWorld,
        setKeyControls, commands, controls} from '../src/scriptenv';


describe('Commands', () => {
    var world = new Engine(undefined, undefined);
    var ship = makeShipEntity(universe.ships['Boid'], 1, 2, 3);
    world.ships.push(ship);
    setGameWorld(world)
    setCurrentEntity(ship)
    describe("#headingToClosestShipIn", () => {
        it("notices if called with not enough arguments", () => {
            assert.notEqual(undefined, controls.headingToClosestShipIn(.5))
            assert.throws(function(){controls.headingToClosestShipIn();})
        });
    });
});
