function comeBackIfOutOfBounds(){
  if (x() < -100 && dx() < 0){
    turnTo(0);
  } else if(x() > 300 && dx() > 0){
    turnTo(180);
  } else if (y() < -100 && dy() < 0){
    turnTo(90);
  } else if (y() > 300 && dy() > 0){
    turnTo(270);
  }
  thrustFor(1);
}

function stayInBounds(){
  while (true){
    comeBackIfOutOfBounds();
    leftFor(3);
  }
}

function greet(){
  1 + 1;
}

function manual(){
  waitFor(0.001);
  cutThrust();
  noTurn();
  if (keyPressed('UP')){ fullThrust(); }
  if (keyPressed('LEFT')){ fullLeft(); }
  if (keyPressed('RIGHT')){ fullRight(); }
  if (keyPressed(' ')){ fireMissile(stayInBounds, '#aa1144'); }
  if (keyPressed('w')){ waitFor(1); }
}

while (true){
  manual();
}
