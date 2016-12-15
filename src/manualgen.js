// Putting generators in a separate file avoids
// the need for a generator shim from Babel (but means
// there's no generator shim: this won't work in browsers
// that can't do generators)
// TODO this doens't seem to be working right now. Need to prevent this
// from being transpiled, or delete the comment above and give up on this

export function* keypress(controls){
    var event = yield* controls.getEvent();
    if (event.type === 'keydown'){
      return keyboardMap[event.keyCode];
    }
    return null;
}

export function* getEvent(){
    var events = this.events;
    yield function(){
        return events.length > 0;
    };
    while (this.events.length > 2 &&
           this.events[0].keyCode === this.events[1].keyCode &&
               this.events[0].type === 'keydown' &&
                   this.events[1].type === 'keydown'){
        var cleaned = this.events.shift();
    //console.log('cleaned', cleaned);
    }
    return this.events.shift();
}
