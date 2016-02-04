function* pilotScript(e){
  yield ai.thrustFor(e, 0.1);
  yield* ai.thrustUntilStopped(e);
  while (true){
    if (e.y > 400 && e.dy > 0){
      yield ai.turnTo(e, 270);
      yield ai.thrustFor(e, 0.2);
    } else if (e.y < 200 && e.dy < 0){
      yield ai.turnTo(e, 90);
      yield ai.thrustFor(e, 0.2);
    }
    var spot = yield* scanForEnemy(e);
    yield* fireMissile(e);
  }
}

// players would get to write their own ai for missiles
// in a syncronous style, which would desugar to yields
function* missileScript(e){
  yield ai.thrustFor(e, 0.6);
  while (true){
    yield* missilePursuit(e);
    yield* ai.detonateIfCloserThanFor(e, world, 30, 0.001);
  }
}
function* missilePursuit(e){
  var closest = world.findClosestShip(e);
  yield* ai.slowDownIfWrongWay(e, closest);
  yield ai.turnTowardFor(e, e.towards(closest), 0.2);
  e.speedInDirection(e.towards(closest));
  if (e.speed() < 300){
    yield ai.thrustFor(e, 0.1);
  }
}
// maybe users would write their own controls
function* manualDrive(e){
  while (true){
    key = yield* manual.actOnKey(e, controls);
    if (key === 'space'){
      yield* fireMissile(e);
    } else if (key == 'f'){
      yield* fireLaser(e);
    }
  }
}
function* boidScript(e){
  ai.setThrust(e, e.maxThrust * 0.5);
  yield ai.turnLeft(e, 180);
  yield ai.waitFor(e, 10);
  yield ai.turnLeft(e, 180);
  yield ai.waitFor(e, 10);
  yield ai.turnLeft(e, 180);
  yield ai.waitFor(e, 10);
}

// this is an example of a scanner that returns data
function* scanForEnemy(e){
  e.scanning = true;
  yield ai.waitFor(e, 1);
  e.scanning = false;
  return [300, 200];
}
// builtins the user might have access to
function* fireMissile(e){
    yield ai.waitFor(e, 0.1);
    world.addEntity(space.fireMissile(e, missileScript));
    yield ai.waitFor(e, 0.1);
}
function* fireLaser(e){
    world.addEntity(space.fireLaser(e));
    yield ai.waitFor(e, 0.05);
}

exports.pilotScript = pilotScript;
exports.missileScript = missileScript;
exports.boidScript = boidScript;
exports.manualDrive = manualDrive;