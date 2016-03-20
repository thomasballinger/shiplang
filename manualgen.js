// Putting generators in a separate file avoids
// the need for a generator shim from Babel (but means
// there's no generator shim: this won't work in browsers
// that can't do generators)

export function* actOnKey(e, controls){
    var event = yield* controls.getEvent();
    switch(event.keyCode){
        case 38:
            if (event.type === 'keydown'){
            e.thrust = e.maxThrust;
        } else if (event.type === 'keyup'){
            e.thrust = 0;
        }
        break;
        case 37:
            if (event.type === 'keydown'){
            e.dh = -e.maxDH;
        } else if (event.type === 'keyup'){
            e.dh = 0;
        }
        break;
        case 39:
            if (event.type === 'keydown'){
            e.dh = e.maxDH;
        } else if (event.type == 'keyup'){
            e.dh = 0;
        }
        break;
        case 40:
            if (event.type === 'keydown'){
            e.hTarget = (e.vHeading() + 180) % 360;
        } else if (event.type == 'keyup'){
            e.hTarget = undefined;
        }
        break;
        default:
            if (event.type === 'keydown'){
            return keyboardMap[event.keyCode];
        }
        break;
    }
    return null;
}

function* getEvent(){
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
