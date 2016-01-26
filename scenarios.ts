import ships = require('./ships');
import entity = require('./entity');
import space = require('./space');
import scriptEnv = require('./scriptenv');

var builtinSource = require("raw!./pilot.sl");
var builtinScripts = scriptEnv.getScripts(builtinSource);

// Scenarios return a function that constructs a world when given
// a dictionary of user-provided SL scripts
interface Scenario {
    (): WorldBuilder;
}
export interface WorldBuilder {
    (scripts: any): space.SpaceWorld;
    instructions: string
}

export var scenario1 = function():any{
    var boidArgs = <number[][]>[];
    for (var i=0; i<20; i++){
      boidArgs.push([Math.random()*1000-500,
                     Math.random()*1000-500,
                     Math.random()*10-5,
                     Math.random()*10-5,
                     Math.random() * 360,
                     Math.random() * 100 - 50]);
    }

    var reset = <WorldBuilder>function reset(userScripts: any): space.SpaceWorld {

        var scriptNames = Object.keys(userScripts);
        var boidScript = <entity.Script>undefined;
        if (scriptNames.length === 1){
            boidScript = userScripts[scriptNames[0]];
        } else {
            boidScript = '1' || builtinScripts.enemyScript || builtinScripts.enemyScript;
        }
        var playerScript = userScripts.pilotScript || builtinScripts.pilotScript;
        var enemyScript = '1' || userScripts.ship || builtinScripts.enemyScript;
        console.log(boidScript, playerScript, enemyScript)

        var world = new space.SpaceWorld();

        var ship = space.makeShip(-200, 350, 270, playerScript);
        ship.imtheplayer = true;
        var ship2 = space.makeShip(-300, 350, 270, enemyScript);
        world.addEntity(ship);
        world.addEntity(ship2);
        //world.addEntity(space.makeShip(70, 190, 270, scripts.pilotScript));
        for (var i=0; i<20; i++){
            world.addEntity(space.makeBoid(boidArgs[i][0], boidArgs[i][1], boidArgs[i][2],
                                           boidArgs[i][3], boidArgs[i][4], boidArgs[i][5],
                                           boidScript));
        }

        return world;
    }
    reset.instructions = `
    field of boids shooting missiles, or uses user script for boids
    if it defines one function. If more than one function is defined,
    looks for
    * a function called "boid" to use for boids,
    * a function called "ship" to use for an enemy ship, and
    * a function called "pilot" to use for player's ship
    `
    return reset;
}
