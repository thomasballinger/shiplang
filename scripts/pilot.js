var alternate = 0;

function manual(){
  waitFor(0.001);
  cutThrust();
  noTurn();
  if (keyPressed('UP')){ fullThrust(); }
  if (keyPressed('LEFT')){ fullLeft(); }
  if (keyPressed('RIGHT')){ fullRight(); }
  if (keyPressed(' ')){
    if (alternate){
      fireMissile(ProNav, '#aa1144');
      alternate = 0;
    } else {
      fireMissile(towardExpected, '#11aa44');
      alternate = 1;
    }
  }
  if (keyPressed('w')){ waitFor(1); }
  if (keyPressed('l')){ land(); }
  if (keyPressed('j')){ jump(); }
  if (keyPressed('f')){ fireLaser(); }
}
// Try adding laser firing! Call fireLaser() somewhere

function ProNav(){
  thrustFor(1);
  while (true){
    thrustFor(0.1);
    var initial = headingToClosestOfGov('pirate');
    waitFor(0.1);
    var newHeading = headingToClosestOfGov('pirate');
    if (headingToLeft(initial, newHeading)){
      rightFor(0.01 * headingDiff(initial, newHeading));
    } else {
      leftFor(0.01 * headingDiff(initial, newHeading));
    }
  }
}

function towardExpected(){
  thrustFor(1);
  while(true){
    var dt = distToClosestOfGov('pirate') / 300;
    var dir = headingToClosestOfGovIn('pirate', dt);
    turnTo(dir);
    thrustFor(.1);
  }
}

function dumbRocket(){
  thrustFor(2);
  while (true){
    if (distToClosestShip() < 40){
      detonate();
    }
    thrustFor(0.1);
  }
}


function stayInBounds(){
  while (true){
    comeBackIfOutOfBounds();
    leftFor(3);
  }
}


while (true){
  manual();
}
