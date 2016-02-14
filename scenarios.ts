import { SpaceWorld, makeShip, makeBoid, makePlanet, makeComponent } from './space';
import { SLgetScripts } from './scriptenv';
import { WorldBuilder } from './interfaces';
import { Player } from './player';
import * as ships from './ships';

var builtinScripts = SLgetScripts(require("raw!./scripts/pilot.sl"));

// Scenarios return a function that constructs a world when given
// a dictionary of user-provided SL scripts
export var gunner = function():any{
    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {
        var world = new SpaceWorld();
        var p = Player.fromStorage().spaceLocation;
        var ship = makeComponent(ships.Gunship, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        world.addBackgroundEntity(makePlanet(400, 300, 40, '#ab43af'));
        world.addEntity(makeShip(ships.Triangle, -300, 350, 270, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Triangle, -500, 250, 170, builtinScripts.citizenScript));
        world.addEntity(makeShip(ships.Holder, 0, 200, 270, builtinScripts.holderScript));
        world.addEntity(makeShip(ships.Triangle, 200, 250, 90, builtinScripts.citizenScript));
        world.addEntity(ship); // adding the ship last means it goes in front
        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    return reset
}

export var scenario1 = function():any{
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
    var reset = <WorldBuilder>function reset(script: any): SpaceWorld {
        var world = new SpaceWorld();
        var p = Player.fromStorage().spaceLocation;
        var ship = makeShip(ships.Triangle, p[0], p[1], 270, script);
        ship.imtheplayer = true;
        var earth = makePlanet(100, 100, 50);
        earth.onLand = function(){
            console.log('landed on earth');
            Player.fromStorage().set('location', 'earth').go();
        }
        var luna = makePlanet(300, 200, 30, '#eeeebb');
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
        world.addEntity(makeShip(ships.Triangle, -300, 350, 270, builtinScripts.enemyScript));
        world.addEntity(makeShip(ships.Triangle, -500, 250, 270, builtinScripts.enemyScript));
        world.addEntity(ship); // adding the ship last means it goes in front
        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    return reset
}
