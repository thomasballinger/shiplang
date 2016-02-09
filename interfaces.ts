import { Entity, Ship } from './entity';
import { CompiledFunctionObject, BC } from './eval';
import { SpaceWorld } from './space';
import { UserFunctionBodies } from './userfunctionbodies';

export interface Selection {
    start: number;
    finish: number;
}

export interface Interpreter {
    step(): boolean;
    run(): boolean;
    isReady: ()=>boolean;
    paused_: boolean;
    stateStack: any;
}

export interface Generator {
    next(): {value: any, done: boolean}
}

export interface Editor {
    getCode(): string;
    setCode(s: any): void;
    setListener(cb: ()=>void): void;
}

export type GameTime = number;

export type Script = ((e: Entity)=>Generator) |
                     [string, UserFunctionBodies, (selections: Selection[])=>void] |
                     CompiledFunctionObject |
                     string;

export type ByteCode = [BC, any];

export interface WorldBuilder {
    (scripts: any): SpaceWorld;
    instructions: string
}

// These define a ship type but not its instantaneous properties
export interface ShipSpec {type: string,
                    r: number,
                    maxThrust: number,
                    maxDH: number,
                    maxSpeed: number,
                    explosionSize: number,
                    isMunition: boolean,
                    armorMax: number,
                    isInertialess: boolean,
                    lifespan: number,
}

export interface Context {
    done: boolean;
    step(e: Ship):void;
    safelyStep(e: Ship, onError: (e: string)=>void):boolean; // returns whether step succeeded
}
