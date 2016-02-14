function manual(){
  waitFor(0.001);
  if (keyPressed(' ')){ fireMissile(goAndExplode, '#aa1144'); }
  if (keyPressed('f')){ fireLaser('#aabbcc'); }
}

function goAndExplode(){
  thrustFor(2);
  detonate();
}

while (true){
  manual();
}
