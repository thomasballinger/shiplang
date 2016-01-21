(defn pilotScript ()
  (leftFor .6)
  (forever
    (log "x:" x "y:" y "speed:" speed)
    (thrustFor .1)
    (leftFor .1)
    (fireMissile goScript)))

(defn goScript ()
  (forever
    (thrustFor .3)
    (if (< distToClosestShip 30)
        (detonate))
    (leftFor .1)
    (define targetHeading (headingToClosest))
    (turnTo targetHeading)))

;    (forever
;        (if (and (> y 400) (> e.dy 0))
;	        (do (turnTo 270)
;                (thrustFor .2))
;            (if (and (< y 200) (< dy 0))
;                (do (turnTo 90)
;                    (thrustFor .2))))
;        (define spot scanForEnemy)
;        (ping spot)
;        (fireMissile)))

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


