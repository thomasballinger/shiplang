import * as _ from 'lodash';

import { Engine, makeShip, makeBoid, makePlanet } from './engine';
import { WorldBuilder, ShipSpec, Gov } from './interfaces';
import * as objectivebar from './objectivebar';
import { Profile } from './profile';
import * as ships from './ships';
import { putMessage } from './messagelog';
import { createObjects, System, Fleet, Spob, Start } from './universe';
import { loadData } from './dataload';
import { getScriptByName } from './ai';

var gamedata = loadData(require('raw!./data/map.txt'));

// A ship builder object should be built that uses a random seed
// (for reproducibility) to create ships with random probability.
// It can be asked to spawn initial ships, and asked to spawn more
// ships on a 30 times per second basis.
// Needs to be deterministic given a seed.

export var fromStart = function(startName: string):any{
    var universe = createObjects(gamedata);
    var seed = Math.random();
    var start = universe.starts[startName];
    Profile.clear()
    start.buildProfile().save()
    var system = start.system

    var reset = <WorldBuilder>function reset(playerScript: any): Engine {

        console.log(playerScript)
        var profile = Profile.fromStorage()
        var world = new Engine(system, profile);

        // Planets
        for (var [spob, [x, y]] of system.spobSpots(profile.day)){
            world.addBackgroundEntity(makePlanet(x, y, spob.radius, spob.color));
        }

        // Fleets
        for (var fleet of system.getFleets(5)){
            console.log('fleet added:', fleet);
            world.addFleet(fleet);
        }
        // Mission fleets
        for (var [spec, script] of profile.getMissionShips()){
            world.addEntity(makeShip(spec, Math.random()*1000,
                                     Math.random()*1000, 270, script));
        }

        // Player Ship
        var ship = makeShip(profile.ship, 0, 0, 270, playerScript);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        world.addEntity(ship);

        putMessage(profile.missionsSummary());

        if ((<any>window).DEBUGMODE){ (<any>window).world = world; }
        if ((<any>window).DEBUGMODE){ (<any>window).player = world.getPlayer(); }
        return world;
    }
    reset.controlsDelay = system.delay || 0;

    return reset;
}

/*
export var robo = function():any{
    objectivebar.set(`
    Cosmic interference causes manual controls to be unresponsive in this region.<br />
    You'll be best equipped if you let your ship's computer do the piloting.`);

    var reset = <WorldBuilder>function reset(script: any): Engine {
        var world = new Engine(Profile.fromStorage());
        var p = Profile.fromStorage().spaceLocation;
        var ship = makeShip(ships.Triangle, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        var tolok = makePlanet(200, -100, 200, '#420209');
        tolok.onLand = function(){
            putMessage('landed on the alien planet of Tolok');
            Profile.fromStorage().set('location', 'tolok').go();
        }
        world.addBackgroundEntity(tolok);
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, getScriptByName('attackScript')));
        world.addEntity(makeShip(ships.FatTriangle, -1300, 1200, 170, getScriptByName('attackScript')));
        world.addEntity(makeShip(ships.FatTriangle, 1000, 400, 170, getScriptByName('attackScript')));
        world.addEntity(ship); // adding the ship last means it goes in front
        if ((<any>window).DEBUGMODE){ (<any>window).world = world; }
        return world;
    }
    reset.instructions = "i"
    reset.controlsDelay = 1000
    return reset
}
*/
