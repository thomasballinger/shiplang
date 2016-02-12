import { SpaceWorld, makeShip, makeBoid, makePlanet } from './space';
import { SLgetScripts } from './scriptenv';
import { WorldBuilder } from './interfaces';

var builtinSource = require("raw!./pilot.sl");
var builtinScripts = SLgetScripts(builtinSource);

// Scenarios return a function that constructs a world when given
// a dictionary of user-provided SL scripts
interface Scenario {
    (): WorldBuilder;
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

        var ship = makeShip(-200, 350, 270, playerScript);
        (<any>window).ship = ship;
        var ship2 = makeShip(-300, 350, 270, enemyScript);
        ship.imtheplayer = true;
        world.addEntity(ship);
        world.addEntity(ship2);
        //world.addEntity(makeShip(70, 190, 270, scripts.pilotScript));
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
        var ship = makeShip(0, 0, 270, script);
        ship.imtheplayer = true;
        world.addBackgroundEntity(makePlanet(100, 100, 50));
        world.addBackgroundEntity(makePlanet(300, 200, 30));
        world.addBackgroundEntity(makePlanet(-200, 1300, 45, '#ee3333'));
        world.addEntity(makeShip(-300, 350, 270, builtinScripts.enemyScript));
        world.addEntity(makeShip(-500, 250, 270, builtinScripts.enemyScript));
        world.addEntity(ship); // adding the ship last means it goes in front
        (<any>window).world = world;
        return world;
    }
    reset.instructions = "i"
    return reset
}
