/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Boid } from '../ships';
import { System, makeShip } from '../system';
import {setCurrentEntity, setGameTime, setGameWorld,
        setKeyControls, commands, controls} from '../scriptEnv';


describe('Commands', () => {
    var world = new System();
    var ship = makeShip(Boid, 1, 2, 3);
    world.addEntity(ship);
    setGameWorld(world)
    setCurrentEntity(ship)
    describe("#headingToClosestShipIn", () => {
        it("notices if called with not enough arguments", () => {
            console.log(controls.headingToClosestShipIn(.5))
            assert.notEqual(undefined, controls.headingToClosestShipIn(.5))
            assert.throws(function(){controls.headingToClosestShipIn();})
        });
    });
});