import space = require('./space');

export class UserFunctionBodies{
    constructor(){
        this.reset();
    }
    bodies: {[name: string]: any}
    accessedThisTick: {[name: string]: boolean};
    saves: {[name: string]: space.SpaceWorld};
    reset(){
        this.accessedThisTick = {};
        this.bodies = {}
        this.saves = {};
    }
    getBody(name: string){
        console.log('retrieving named function:', name)
        this.accessedThisTick[name] = true;
        if (!this.bodies.hasOwnProperty(name)){
            throw Error("can't find function body "+name);
        }
        return this.bodies[name];
    }
    saveBody(name: string, body: any){
        console.log('saving named function:', name)
        this.bodies[name] = body;
        this.accessedThisTick[name] = true;
    }
    save(world: space.SpaceWorld){
        if (Object.keys(this.accessedThisTick).length === 0){ return; }
        var copy = world.copy();
        for (var funcName of Object.keys(this.accessedThisTick)){
            this.saves[funcName] = copy;
        }
    }
}
