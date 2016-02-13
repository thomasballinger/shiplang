function manual(){
  waitFor(0.001);
  if (keyPressed(' ')){ fireMissile(stayInBounds, '#aa1144'); }
  if (keyPressed('f')){ fireLaser(); }
}

function goAndExplode(){
  thrustFor(2);
  detonate();
}

while (true){
  manual();
}
