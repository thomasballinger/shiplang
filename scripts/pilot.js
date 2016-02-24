function manual(){
  waitFor(0.001);
  cutThrust();
  noTurn();
  if (keyPressed('UP')){ fullThrust(); }
  if (keyPressed('LEFT')){ fullLeft(); }
  if (keyPressed('RIGHT')){ fullRight(); }
  if (keyPressed(' ')){ fireMissile(dumbRocket, '#aa1144'); }
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

function stayInBounds(){
  while (true){
    comeBackIfOutOfBounds();
    leftFor(3);
  }
}


while (true){
  manual();
}
