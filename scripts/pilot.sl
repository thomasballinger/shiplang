(defn pilotScript ()
  (forever
    (define key (keypress))
    (if (= key " ")
        (fireMissile goScript "#3322bb"))
    (if (= key "G")
        (fireNeedleMissile needleScript "#77ee33"))
    (if (= key "F")
        (fireLaser "#11dd55"))))

(defn goScript ()
  (thrustFor .4)
  (forever
    (thrustFor .2)
    (if (< (distToClosestShip) 30)
        (detonate))
    (define targetHeading (headingToClosestShip))
    (turnTo targetHeading)))

(defn needleScript ()
  (thrustFor .4)
  (forever
    (define targetHeading (headingToClosest))
    (turnTo targetHeading)))

(defn attackScript ()
  (forever
    (if (> (distToClosestShip) 300)
      (do
        (turnTo (headingToClosestShip))
        (thrustFor .1)))
    (if (< (distToClosestShip) 800)
      (do
        (aimAtClosestEnemy)
        (fireLaser "#cccc21")
        (fireLaser "#cccc21")
        (fireLaser "#cccc21")))))

(defn enemyScript ()
  (leftFor .6)
  (forever
    (fireMissile goScript "#ffaabb")
    (thrustFor .1)
    (leftFor .1)))
;    (forever
;        (if (and (> y 400) (> e.dy 0))
;            (do (turnTo 270)
;                (thrustFor .2))
;            (if (and (< y 200) (< dy 0))
;                (do (turnTo 90)
;                    (thrustFor .2))))
;        (define spot scanForEnemy)
;        (ping spot)
;        (fireMissile)))

(defn wander ()
  (forever
    (leftFor (rand))
    (thrustFor (rand))
    (turnTo (headingToClosestPlanet))
    (thrustFor (+ 1 (rand)))))

(defn boundingBox ()
  (forever
    (thrustFor .1)
    (if (and (> y 400) (> dy 0))
        (do (turnTo 270)
            (thrustFor .2))
        (if (and (< y 400) (< dy 0))
            (do (turnTo 90)
                (thrustFor .2))))))

(defn visitPlanetsScript ()
  (stop)
  (define i (randInt 3))
  (while 1
    (define i (+ i (randInt 0 3)))
    (while (or (> (distToNthPlanet i) 50)
               (> speed 100))
      (turnTo (headingToNthPlanet i))
      (if (< (distToNthPlanet i)
             (* speed (+ (stopTime) (reverseTime))))
          (do (stop)
              (waitFor 3)))
      (thrustFor .1))))

(defn holderScript ()
  (while true
    (seekGun)
    (while (and (> (enemyCount) 0)
                (> (numAttached) 0))
      (hunt))
    (while (> numAttached 0)
       (visitPlanetsScript))))

; assumes a barrage of three lasers
(defn aimAtClosestEnemy ()
  (define laserTime (/ (distToClosestEnemy)
                (+ laserSpeed (closingToClosestEnemy))))
  (define dt (+ laserTime 0))
  (define heading (headingToClosestEnemyIn dt))

  (define turnTime (/ (headingDiff h heading) maxDH))
  (define dt (+ laserTime turnTime))
  (define laserTime (/ (distToClosestEnemyIn dt)
                (+ laserSpeed (closingToClosestEnemy))))
  (define dt (+ laserTime turnTime))

  (define timeToMid (+ dt .1))
  (define heading (headingToClosestEnemyIn timeToMid))

  (turnTo heading))


(defn aim ()
  (define laserTime (/ (distToClosestEnemy)
      (+ laserSpeed (closingToClosestEnemy))))
  (define heading (headingToClosestEnemyIn laserTime))

  (define turnTime (/ (headingDiff h heading) maxDH))
  (define dt (+ laserTime turnTime))
  (define laserTime (/ (distToClosestEnemyIn dt)
                       (+ laserSpeed
                          (closingToClosestEnemy))))
  (define dt (+ laserTime turnTime))

  (define heading (headingToClosestEnemyIn (+ dt .3)))
  (turnTo heading))

(defn hunt ()
  (aim)
  (if (> (distToClosestEnemy) 500)
      (thrustFor .4)
      (thrustFor .1)))

(defn reverseTime () (/ 180 maxDH ))
(defn stopTime () (/ speed maxThrust))

(defn stop ()
  (turnTo (opp vHeading))
  (thrustFor (stopTime)))

; pretty crappy stop, only works if vheading = heading
(defn seekGun ()
  (define gun 0)
  (while (< gun 1)
    (turnTo (headingToClosestComponent))
    (thrustFor (if (< (distToClosestComponent) 50) .02 .1))
    (if (< (distToClosestComponent)
           (* speed (+ (stopTime) (reverseTime))))
        (do
          (leftFor (reverseTime))
          (thrustFor (stopTime))
          (define gun (attach))))))
