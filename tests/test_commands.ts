/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Boid } from '../ships';
import { Engine, makeShip } from '../engine';
import {setCurrentEntity, setGameTime, setGameWorld,
        setKeyControls, commands, controls} from '../scriptenv';


describe('Commands', () => {
    var world = new Engine();
    var ship = makeShip(Boid, 1, 2, 3);
    world.addEntity(ship);
    setGameWorld(world)
    setCurrentEntity(ship)
    describe("#headingToClosestShipIn", () => {
        it("notices if called with not enough arguments", () => {
            assert.notEqual(undefined, controls.headingToClosestShipIn(.5))
            assert.throws(function(){controls.headingToClosestShipIn();})
        });
    });
});
