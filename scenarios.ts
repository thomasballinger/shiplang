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

    var reset = <WorldBuilder>function reset(playerScript: any): Engine {

        console.log(playerScript)
        var profile = Profile.fromStorage()
        var world = new Engine(profile);
        var system = start.system

        // Planets
        for (var [spob, [x, y]] of system.spobSpots(profile.day)){
            world.addBackgroundEntity(makePlanet(x, y, spob.radius, spob.color));
        }

        // Fleets
        for (var fleet of system.getFleets(5)){
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
    return reset;
}

// Scenarios return a function that constructs a world when given
// a dictionary of user-provided SL scripts
export var gunner = function():any{
    objectivebar.set(`
    You're a gunner.<br/>
    Use space and f to fire.<br/>
    <a href="/#space" onclick="Profile.fromStorage().set('location', 'Sol').set('script', window.normalScript).go();">quit this job, it sucks</a>`);

    var NUMCIVILIANS = 30
    var civilianArgs = _.range(NUMCIVILIANS).map(function(){
        return [
            [ships.Boid, ships.Shuttle, ships.Triangle][Math.floor(Math.random() * 3)],
            Math.random()*2000 - 1000,
            Math.random()*2000 - 1000,
            Math.random() * 360,
            getScriptByName('foreverVisitPlanetsScript'),
        ];
    });

    var reset = <WorldBuilder>function reset(script: any): Engine {
        var world = new Engine(Profile.fromStorage());
        var p = Profile.fromStorage().spaceLocation;
        var ship = makeShip(ships.Gunship, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        world.addBackgroundEntity(makePlanet(1400, 1300, 40, '#ab43af'));
        world.addBackgroundEntity(makePlanet(-1600, -1800, 60, '#3bd951'));
        world.addBackgroundEntity(makePlanet(-1800, 1600, 80, '#8b2141'));
        world.addEntity(makeShip(ships.Astroid, -300, 350, 270, getScriptByName('wander')));
        world.addEntity(makeShip(ships.Astroid,  300, 350, 270, getScriptByName('wander')));
        world.addEntity(makeShip(ships.Astroid, -300, -350, 270, getScriptByName('wander')));
        world.addEntity(makeShip(ships.Astroid, -200, -350, 270, getScriptByName('wander')));
        world.addEntity(makeShip(ships.Astroid, -100, -350, 270, getScriptByName('wander')));

        civilianArgs.map(function(x){ world.addEntity(makeShip.apply(null, x)) })
        world.addEntity(makeShip(ships.Holder, 0, 200, 270, getScriptByName('holderScript')));
        world.addEntity(ship); // adding the ship last means it goes in front

        putMessage(Profile.fromStorage().missionsSummary());

        if ((<any>window).DEBUGMODE){ (<any>window).world = world; }
        return world;
    }
    reset.instructions = "i"
    return reset
};

export var scenario1 = function():any{

    objectivebar.set(`
    \\ toggles view<br/>
    \` toggles editor<br/>
    <a href="/#space" onclick="Profile.fromStorage().set('location', 'Sol').go();">leave this simulation</a>`);
    var NUMBOIDS = 3
    var boidArgs = <number[][]>[];
    for (var i=0; i<NUMBOIDS; i++){
      boidArgs.push([Math.random()*1000-500,
                     Math.random()*1000-500,
                     Math.random()*10-5,
                     Math.random()*10-5,
                     Math.random() * 360,
                     Math.random() * 100 - 50]);
    }

    var reset = <WorldBuilder>function reset(script: any): Engine {

        var boidScript = getScriptByName('enemyScript');
        var playerScript = script;
        var enemyScript = getScriptByName('enemyScript');

        var world = new Engine(Profile.fromStorage());

        var ship = makeShip(ships.Triangle, -200, 350, 270, playerScript);
        (<any>window).ship = ship;
        var ship2 = makeShip(ships.Triangle, -300, 350, 270, enemyScript);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        world.addEntity(ship);
        world.addEntity(ship2);
        world.addEntity(makeShip(ships.Astroid, -100, 350, 270, getScriptByName('wander')));
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, getScriptByName('attackScript')));
        //world.addEntity(makeShip(ships.Triangle, 70, 190, 270, scripts.pilotScript));
        for (var i=0; i<boidArgs.length; i++){
            world.addEntity(makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                     boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                     boidScript));
        }

        if ((<any>window).DEBUGMODE){ (<any>window).world = world; }
        return world;
    }
    reset.instructions = `
    `
    return reset;
}

export var sol = function():any{
    objectivebar.set(`
    Land on a planet with L<br />
    or travel with J`);

    var reset = <WorldBuilder>function reset(script: any): Engine {
        var world = new Engine(Profile.fromStorage());
        var p = Profile.fromStorage().spaceLocation;
        var ship = makeShip(ships.Triangle, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        ship.government = Gov.Player
        var earth = makePlanet(100, 100, 50, '#004000');
        earth.onLand = function(){
            putMessage('landed on earth');
            Profile.fromStorage().set('location', 'earth').go();
        }
        var luna = makePlanet(300, 200, 30, '#aa9922');
        luna.onLand = function(){
            Profile.fromStorage().set('location', 'level1').set('spaceLocation', [1200, 1300]).go();
        }
        var mars = makePlanet(-200, 1300, 45, '#ee3333');
        mars.onLand = function(){
            console.log('landed on mars');
            Profile.fromStorage().set('location', 'simulator').go();
        }
        world.addBackgroundEntity(earth);
        world.addBackgroundEntity(luna);
        world.addBackgroundEntity(mars);

        for (var y of [550, -2400, 1200, -1000]){
            world.addEntity(makeShip(ships.Shuttle, -300, y, 270, getScriptByName('foreverVisitPlanetsScript')));
            world.addEntity(makeShip(ships.Shuttle, -200, y, 270, getScriptByName('foreverVisitPlanetsScript')));
            world.addEntity(makeShip(ships.Shuttle, -100, y, 270, getScriptByName('foreverVisitPlanetsScript')));
            world.addEntity(makeShip(ships.Shuttle,    0, y, 270, getScriptByName('foreverVisitPlanetsScript')));
            world.addEntity(makeShip(ships.Boid,     100, y, 270, getScriptByName('foreverVisitPlanetsScript')));
            world.addEntity(makeShip(ships.Boid,     200, y, 270, getScriptByName('foreverVisitPlanetsScript')));
        }

        world.addEntity(makeShip(ships.Triangle, -300, -750, 270, getScriptByName('enemyScript')));
        world.addEntity(makeShip(ships.Triangle, -500, -750, 270, getScriptByName('enemyScript')));
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, getScriptByName('attackScript')));
        world.addEntity(ship); // adding the ship last means it goes in front
        if ((<any>window).DEBUGMODE){ (<any>window).world = world; }
        return world;
    }
    reset.instructions = "i"
    return reset
}

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
