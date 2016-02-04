import space = require('./space');

export class UserFunctionBodies{
    constructor(){
        this.reset();
    }
    bodies: {[name: string]: any}
    accessedThisTick: {[name: string]: boolean};
    saves: {[name: string]: [number, space.SpaceWorld]};
    tickNum: number;
    reset(){
        this.accessedThisTick = {};
        this.bodies = {}
        this.saves = {};
        this.tickNum = 0;
    }
    getBody(name: string){
        this.accessedThisTick[name] = true;
        if (!this.bodies.hasOwnProperty(name)){
            throw Error("can't find function body "+name);
        }
        return this.bodies[name];
    }
    saveBody(name: string, body: any){
        this.bodies[name] = body;
        this.accessedThisTick[name] = true;
    }
    save(world: space.SpaceWorld){
        this.tickNum += 1;
        if (Object.keys(this.accessedThisTick).length === 0){ return; }
        var copy = world.copy();
        for (var funcName of Object.keys(this.accessedThisTick)){
            this.saves[funcName] = [this.tickNum, copy];
        }
        this.accessedThisTick = {};
    }

    // Given a list of function names, return the state of the world
    // from the earliest of the worlds saved the last time each of these
    // functions was run.
    //
    // If none of the functions have been run, return undefined to mean
    // don't rewind.
    //
    // If one of the functions has *no saved body*, then return null
    // to mean please totally reset state. No saved body means there's
    // nothing to update.
    getEarliestSave(functions: string[]){
        var earliestTime = Number.MAX_VALUE;
        var earliestSave = <space.SpaceWorld>undefined;
        for (var funcName of functions){
            console.log(funcName, 'has changed...')

            // if function was never *stored* then start over
            if (!this.saves.hasOwnProperty(funcName)){
                return null;
            }

            var [tick, save] = (this.saves[funcName] ||
                                // if a function was never called, no need to rewind.
                                [Number.MAX_VALUE, undefined]);
            console.log(tick, save)
            if (earliestTime >= tick){
                earliestTime = tick;
                earliestSave = save;
            }
        }
        return earliestSave;
    }
}
