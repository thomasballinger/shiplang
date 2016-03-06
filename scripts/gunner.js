function manual(){
  waitFor(0.001);
  if (keyPressed('g')){
      chargeFor(0.03);
  } else if (weaponCharge()){
    fireLaser('#ffbb33');
  }
  if (keyPressed(' ')){ fireMissile(goAndExplode, '#aa1144'); }
  if (keyPressed('f')){ fireLaser('#aabbcc'); }
  if (keyPressed('d')){ detach(); }
}

function goAndExplode(){
  thrustFor(2);
  detonate();
}

while (true){
  manual();
}
