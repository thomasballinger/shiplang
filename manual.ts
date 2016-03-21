var keyboardMap = require('./keyboardmap').keyboardMap;
var keyCodeFor = require('./keyboardmap').keyCodeFor;
var manualgen = require('./manualgen');


// should be able to build a new controls object (using the same handlers?
// swapping out the handlers?)
// The thing with the handlers should perisist
//
// Two notions of current state: presented and actual.
// Actual is necessary so e.g. keys don't get stuck down -
// if a 

export class Controls{
    constructor(keyHandlerTarget: HTMLElement, delay: number){
        this.events = [];
        this.pressed = {};
        this.delay = delay || 0;
        this.initialize(keyHandlerTarget);
    }
    events: KeyboardEvent[];
    pressed: { [key: string]: boolean };
    delay: number;
    getEventOrUndefined(){
        if (this.events.length > 0){
            return this.events.shift();
        }
    };
    isPressed(key: string){
        return !!this.pressed[keyCodeFor[key.toUpperCase()]];
    };
    initialize(keyHandlerTarget: HTMLElement){
        var events = this.events;
        var pressed = this.pressed;
        var delay = this.delay;

        keyHandlerTarget.addEventListener('keydown', function(e: KeyboardEvent){

            var handler = (function(innerE: KeyboardEvent){
                return function(){
                    events.push(innerE);
                    pressed[innerE.keyCode] = true;
                };
            })(e);

            if (delay === 0){
                //TODO make delay work in simulator
                // (currently old keystroke will come in late)
                handler();
            } else {
                setTimeout(handler, delay);
            }

            if ([37, 38, 29, 40, // arrows
                32, // spacebar
            8, // backspace
            9, // tab
            ].indexOf(e.keyCode) !== -1){
                e.preventDefault(); // prevents scrolling, back behavior etc.
                //e.stopPropagation();
            }
        });
        /*keyHandlerTarget.addEventListener('keydown', function(e){
          }, true); // useCapture true, so on the way down instead of up!
         */
        keyHandlerTarget.addEventListener('keyup', function(e: KeyboardEvent){

            var handler = (function(innerE: KeyboardEvent){
                return function(){
                    events.push(innerE);
                    pressed[innerE.keyCode] = false;
                };
            })(e);

            if (delay === 0){
                handler();
            } else {
                setTimeout(handler, delay);
            }

            return false;
        });
    };
}
(<any>Controls.prototype).getevent = <any>manualgen.getEvent;

export var keypress = manualgen.keypress;
