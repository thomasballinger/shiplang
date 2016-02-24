import { SpaceWorld, makeShip, makeBoid, makePlanet, makeComponent } from './space';
import { SLgetScripts } from './scriptenv';
import { WorldBuilder } from './interfaces';
import * as objectivebar from './objectivebar';
import { Player } from './player';
import * as ships from './ships';
import { putMessage } from './messagelog';

var builtinScripts = SLgetScripts(require("raw!./scripts/pilot.sl"));
(<any>window).normalScript = require("raw!./scripts/pilot.js");

// Scenarios return a function that constructs a world when given
// a dictionary of user-provided SL scripts
export var gunner = function():any{
    objectivebar.set(`
    You're a gunner.<br/>
    Use space and f to fire.<br/>
    <a href="/#space" onclick="Player.fromStorage().set('location', 'Sol').set('script', window.normalScript).go();">quit this job, it sucks</a>`);
    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {
        var world = new SpaceWorld();
        var p = Player.fromStorage().spaceLocation;
        var ship = makeComponent(ships.Gunship, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        world.addBackgroundEntity(makePlanet(400, 300, 40, '#ab43af'));
        world.addBackgroundEntity(makePlanet(-1200, -1000, 60, '#3bd951'));
        world.addBackgroundEntity(makePlanet(800, 2000, 80, '#8b2141'));
        world.addEntity(makeShip(ships.Triangle, -300, 350, 270, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Triangle, -500, 250, 170, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Triangle, -500, 250, 170, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Triangle, -500, 250, 170, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Holder, 0, 200, 270, builtinScripts.holderScript));
        world.addEntity(makeShip(ships.Triangle, 200, 250, 90, builtinScripts.citizenScript));
        world.addEntity(ship); // adding the ship last means it goes in front

        putMessage('Your mission: destroy 5 astroids.');

        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    return reset
}

export var scenario1 = function():any{

    objectivebar.set(`
    \\ toggles view<br/>
    \` toggles editor<br/>
    <a href="/#space" onclick="Player.fromStorage().set('location', 'Sol').go();">leave this simulation</a>`);
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

    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {

        var boidScript = builtinScripts.enemyScript;
        var playerScript = script;
        var enemyScript = builtinScripts.enemyScript;

        var world = new SpaceWorld();

        var ship = makeShip(ships.Triangle, -200, 350, 270, playerScript);
        (<any>window).ship = ship;
        var ship2 = makeShip(ships.Triangle, -300, 350, 270, enemyScript);
        ship.imtheplayer = true;
        world.addEntity(ship);
        world.addEntity(ship2);
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, builtinScripts.attackScript));
        //world.addEntity(makeShip(ships.Triangle, 70, 190, 270, scripts.pilotScript));
        for (var i=0; i<boidArgs.length; i++){
            world.addEntity(makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                     boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                     boidScript));
        }

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

    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {
        var world = new SpaceWorld();
        var p = Player.fromStorage().spaceLocation;
        var ship = makeShip(ships.Triangle, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        var earth = makePlanet(100, 100, 50, '#004000');
        earth.onLand = function(){
            putMessage('landed on earth');
            Player.fromStorage().set('location', 'earth').go();
        }
        var luna = makePlanet(300, 200, 30, '#aa9922');
        luna.onLand = function(){
            Player.fromStorage().set('location', 'level1').go();
        }
        var mars = makePlanet(-200, 1300, 45, '#ee3333');
        mars.onLand = function(){
            console.log('landed on mars');
            Player.fromStorage().set('location', 'simulator').go();
        }
        world.addBackgroundEntity(earth);
        world.addBackgroundEntity(luna);
        world.addBackgroundEntity(mars);
        world.addEntity(makeShip(ships.Triangle, -300, -750, 270, builtinScripts.enemyScript));
        world.addEntity(makeShip(ships.Triangle, -500, -750, 270, builtinScripts.enemyScript));
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, builtinScripts.attackScript));
        world.addEntity(ship); // adding the ship last means it goes in front
        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    return reset
}

export var robo = function():any{
    objectivebar.set(`
    Cosmic interference causes manual controls to be unresponsive in this region.<br />
    You'll be best equipped if you let your ship's computer do the piloting.
`);

    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {
        var world = new SpaceWorld();
        var p = Player.fromStorage().spaceLocation;
        var ship = makeShip(ships.Triangle, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        var tolok = makePlanet(200, -100, 200, '#420209');
        tolok.onLand = function(){
            putMessage('landed on the alien planet of Tolok');
            Player.fromStorage().set('location', 'tolok').go();
        }
        world.addBackgroundEntity(tolok);
        world.addEntity(makeShip(ships.FatTriangle, -300, 2000, 170, builtinScripts.attackScript));
        world.addEntity(makeShip(ships.FatTriangle, -1300, 1200, 170, builtinScripts.attackScript));
        world.addEntity(makeShip(ships.FatTriangle, 1000, 400, 170, builtinScripts.attackScript));
        world.addEntity(ship); // adding the ship last means it goes in front
        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    reset.controlsDelay = 1000
    return reset
}
