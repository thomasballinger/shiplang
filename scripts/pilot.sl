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
        (thrustFor .1))
    (if (and (< (headingDiff h (headingToClosestShip)) 5)
	     (< (distToClosestShip) 800))
      (do
        (fireLaser "#123456")
        (fireLaser "#123456")
        (fireLaser "#123456")))
    (define targetHeading (headingToClosestShip))
    (turnTo targetHeading)))

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
    (leftFor (rand))
    (thrustFor (rand))
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

(defn citizenScript ()
  (stop)
  (define i 0)
  (while 1
    (define i (+ i 1))
    (while (or (> (distToNthPlanet i) 50)
               (> speed 100))
      (turnTo (headingToNthPlanet i))
      (if (< (distToNthPlanet i)
             (* speed (+ (stopTime) (reverseTime))))
          (stop))
      (thrustFor .1))))

(defn holderScript ()
  (seekGun)
  (while (> (countByType "astroid") 0)
    (hunt "astroid"))
  (citizenScript))

(defn hunt (type)
  (turnTo (headingToClosestByType type))
  (if (> (distToClosestByType type) 500)
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
; when syntax checking: x, y, dx, dy, and others
; are all dynamic scope. Assigning to them is an error.
;
; when syntax checking: warn when shadowing with define.
; Provide syntax hints when using builtins.
;

; do we need tail-call optimization? Recursion kinda sucks...
; but then mutual recursion is a natural way to build interfaces,
; a la text adventure games that blow the stack.

; Only some functions are available, as determined by
; equipment loadout - as the user types, highlight
; those that aren't installed differently
; than 

; somehow suggest the name of scripts - I guess start with them
; loaded.
;

;* JS interop
;* possible to cause a yield from a JS function
;make it possi
;
;thrustFor etc. are builtins higher up the scope chain.
;Their implementations are wrt the current entity,
;and they all 
;
;Need to implement ai functions as yeilds


