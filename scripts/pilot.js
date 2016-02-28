function manual(){
  waitFor(0.001);
  cutThrust();
  noTurn();
  if (keyPressed('UP')){ fullThrust(); }
  if (keyPressed('LEFT')){ fullLeft(); }
  if (keyPressed('RIGHT')){ fullRight(); }
  if (keyPressed(' ')){ fireMissile(ProNav, '#aa1144'); }
  if (keyPressed('w')){ waitFor(1); }
  if (keyPressed('l')){ land(); }
  if (keyPressed('j')){ jump(); }
}
// Try adding laser firing!
// Your ship has a laser gun installed,
// just call fireLaser() wherever you want.

function dumbRocket(){
  thrustFor(2);
  while (true){
    if (distToClosestShip() < 40){
      detonate();
    }
    thrustFor(0.1);
  }
}

function ProNav(){
  thrustFor(1);
  while (true){
    thrustFor(0.1);
    var initial = headingToClosestByType('fattriangle');
    waitFor(0.1);
    var newHeading = headingToClosestByType('fattriangle');
    if (headingToLeft(initial, newHeading)){
      rightFor(0.01 * headingDiff(initial, newHeading));
    } else {
      leftFor(0.01 * headingDiff(initial, newHeading));
    }
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
