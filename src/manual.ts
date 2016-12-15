var keyboardMap = require('./keyboardmap').keyboardMap;
var keyCodeFor = require('./keyboardmap').keyCodeFor;
var manualgen = require('./manualgen');


// should be able to build a new controls object (using the same handlers?
// swapping out the handlers?)
// The thing with the handlers should perisist
//
// Two notions of current state: presented and actual.
// Actual is necessary so e.g. keys don't get stuck down.
// It should persist across undos. It should be instant even when delay
// is present.
// Presented is what the ship can read. It should be serializable for the
// first frame of an undo and then correct to match reality.

/** Holds the true state of inputs */
export class InputHandler{
    constructor(keyHandlerTarget: HTMLElement){
        this.pressed = {};
        if (keyHandlerTarget){
            this.initialize(keyHandlerTarget);
        } else {
            //console.warn('InputHandler created without setting event listeners')
        }
    }
    pressed: { [key: string]: boolean };
    observer: Controls;
    initialize(keyHandlerTarget: HTMLElement){
        var self = this;

        keyHandlerTarget.addEventListener('keydown', function(e: KeyboardEvent){
            self.pressed[e.keyCode] = true;

            if ([37, 38, 29, 40, // arrows
                 32, // spacebar
                 8, // backspace
                 9, // tab
            ].indexOf(e.keyCode) !== -1){
                e.preventDefault(); // prevents scrolling, back behavior etc.
                //e.stopPropagation();
            }

            if(self.observer){
                if (self.observer.delay){
                    var observer = self.observer;
                    var update = (function(innerE: KeyboardEvent, pressedCopy: { [key: string]: boolean }): void{
                        // use current observer at event time
                        observer.update(innerE, pressedCopy);
                    })(e, self.pressedCopy());
                    setTimeout(update, self.observer.delay);
                } else {
                    self.observer.update(e, self.pressedCopy());
                }
            }
        });

        keyHandlerTarget.addEventListener('keyup', function(e: KeyboardEvent){
            self.pressed[e.keyCode] = false;

            if(self.observer){
                if (self.observer.delay){
                    var observer = self.observer;
                    var update = (function(innerE: KeyboardEvent, pressedCopy: { [key: string]: boolean }){
                        // use current observer at event time
                        observer.update(undefined, pressedCopy);
                    })(undefined, self.pressedCopy());
                    setTimeout(update, self.observer.delay);
                } else {
                    self.observer.update(e, self.pressedCopy());
                }
            }
            return false;
        });
    }
    pressedCopy(): { [key: string]: boolean }{
        return JSON.parse(JSON.stringify(this.pressed));
    }
    /** Do an immediate update regardless of delay */
    updateObserver(){
        this.observer.update(undefined, this.pressedCopy());
    }
}

/**
 * A possibly delayed view of input state.
 * It can be saved and restored for rewinds.
 */
export class Controls{
    constructor(public inputHandler: InputHandler, public delay=0){
        this.events = [];
        this.pressed = {};
    }
    events: KeyboardEvent[];
    pressed: { [key: string]: boolean };

    /** Steals the keyboard handler for itself */
    activate(){
        this.inputHandler.observer = this;
    }
    update(e: KeyboardEvent, pressed: { [key: string]: boolean }): void{
        this.pressed = pressed;
        this.events.push(e)
    }
    updateFromInputHandler(){
        if (this.inputHandler){
            if (this.inputHandler.observer !== this){
                throw Error('Tried to make input handler update another controller');
            }
            this.inputHandler.updateObserver()
        } else {
            this.pressed = {};
        }
    }
    getEventOrUndefined(): KeyboardEvent{
        if (this.events.length > 0){
            return this.events.shift();
        }
    };
    isPressed(key: string){
        //return !!this.pressed[keyCodeFor[key.toUpperCase()]];
        var isPressed = !!this.pressed[keyCodeFor[key.toUpperCase()]];
        return isPressed
    };
    copy(): Controls{
        var copy = new Controls(this.inputHandler, this.delay);
        copy.pressed = this.pressed;
        copy.events = this.events.slice();
        return copy;
    }
}
(<any>Controls.prototype).getevent = <any>manualgen.getEvent;

export var keypress = manualgen.keypress;
