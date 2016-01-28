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
    thrustFor(1)
}

while (true){
    comeBackIfOutOfBounds()
    leftFor(1)
}
