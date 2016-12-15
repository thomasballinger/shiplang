import { Engine } from './engine';
import { Controls } from './manual';

/** Tracks current bodies of user defined functions and
 * keeps track of which have been called when.
 */
export class UserFunctionBodies{
    constructor(){
        this.reset();
    }
    bodies: {[name: string]: any}
    accessedThisTick: {[name: string]: boolean};
    saves: {[name: string]: [number, Engine, Controls]};
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
        if (body.type === 'FunctionDeclaration'){
            console.warn('function declaration saved as body - this could be ok if the body of the function saved is itself');
            console.warn('a function declaration, but is not then save is being used incorrectly');
            throw Error('asdf')
        }
        this.bodies[name] = body;
    }
    // Ought to be called after a tick with pre-tick world state
    save(world: Engine, controls: Controls){
        this.tickNum += 1;
        if (Object.keys(this.accessedThisTick).length === 0){ return; }
        for (var funcName of Object.keys(this.accessedThisTick)){
            this.saves[funcName] = [this.tickNum, world, controls];
        }
        this.accessedThisTick = {};
    }
    // Should be called with a *copy* of the world and controls.

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
    getEarliestSave(functions: string[]): [Engine, Controls]{
        var earliestTime = Number.MAX_VALUE;
        var earliestWorld = <Engine>undefined;
        var earliestControls = <Controls>undefined;
        for (var funcName of functions){

            // if function was never *stored* then start over
            if (!this.bodies.hasOwnProperty(funcName)){
                return null;
            }

            var [tick, savedWorld, savedControls] = (this.saves[funcName] || // if a function was never called, no need to rewind.
                                [Number.MAX_VALUE, undefined, undefined]);
            if (earliestTime >= tick){
                earliestTime = tick;
                earliestWorld = savedWorld;
                earliestControls = savedControls;
            }
        }
        return earliestWorld === undefined ? undefined : [earliestWorld, earliestControls];
    }
}
