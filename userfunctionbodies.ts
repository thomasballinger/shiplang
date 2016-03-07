import { Engine } from './engine';

export class UserFunctionBodies{
    constructor(){
        this.reset();
    }
    bodies: {[name: string]: any}
    accessedThisTick: {[name: string]: boolean};
    saves: {[name: string]: [number, Engine]};
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
    }
    // Ought to be called after a tick with pre-tick world state
    save(world: Engine){
        this.tickNum += 1;
        if (Object.keys(this.accessedThisTick).length === 0){ return; }
        for (var funcName of Object.keys(this.accessedThisTick)){
            this.saves[funcName] = [this.tickNum, world];
        }
        this.accessedThisTick = {};
    }
    // Should be called with a *copy* of the world.

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
        var earliestSave = <Engine>undefined;
        for (var funcName of functions){

            // if function was never *stored* then start over
            if (!this.bodies.hasOwnProperty(funcName)){
                return null;
            }

            var [tick, save] = (this.saves[funcName] ||
                                // if a function was never called, no need to rewind.
                                [Number.MAX_VALUE, undefined]);
            if (earliestTime >= tick){
                earliestTime = tick;
                earliestSave = save;
            }
        }
        return earliestSave;
    }
}
