import { Entity, Ship } from './entity';
import { CompiledFunctionObject, BC } from './eval';
import { Engine } from './engine';
import { UserFunctionBodies } from './userfunctionbodies';
import { JSContext } from './codetypes';

export interface Selection {
    start: number;
    finish: number;
}

export interface JSInterpAsyncInput {
    (...args: any[]): (()=>boolean)|string;
    finish: (...args: any[])=> any;
    }

export interface Interpreter {
    step(): boolean;
    run(): boolean;
    isReady: ()=>boolean;
    paused_: boolean;
    stateStack: any;
    copy(): Interpreter;
    exec(func: JSInterpFunction): void;
    runFunctionNow(func: any): void;

    createAsyncFunction(func: JSInterpAsyncInput): void;
    createNativeFunction(func: any): void;
    createPrimitive(obj: any): any;
    setProperty(scope: any, name: string, interp: any): void;
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

export interface JSInterpFunction {
    isPrimitive: boolean;
    type: string;
}

export type Script = ((e: Entity)=>Generator) |
                     [string, UserFunctionBodies, (selections: Selection[])=>void] |
                     [JSContext, JSInterpFunction] |
                     CompiledFunctionObject |
                     string;

export type ByteCode = [BC, any];

export interface WorldBuilder {
    (scripts: any): Engine;
    instructions: string;
    controlsDelay: number;
}

// These define a ship type but not its instantaneous properties
export interface ShipSpec {
    type: string,
    r: number,
    maxThrust: number,
    maxDH: number,
    maxSpeed: number,
    explosionSize: number,
    isMunition: boolean,
    armorMax: number,
    shieldsMax: number,
    isInertialess: boolean,
    lifespan: number,
    isComponent?: boolean;
}
// New properties should be added both above and below
export interface ShipSpecChanges {
    type?: string,
    r?: number,
    maxThrust?: number,
    maxDH?: number,
    maxSpeed?: number,
    explosionSize?: number,
    isMunition?: boolean,
    armorMax?: number,
    shieldsMax?: number,
    isInertialess?: boolean,
    lifespan?: number,
    isComponent?: boolean;
}

export interface Context {
    done: boolean;
    step(e: Ship):void;
    safelyStep(e: Ship, onError: (e: string)=>void):boolean; // returns whether step succeeded
    cleanup():void;
}

export interface Updateable {
    update(e: Entity, w: Engine): void;
}

export interface Scenario {
    (): WorldBuilder;
}

export enum Gov {
    Player,
    Trader,
    Pirate,
    Military,
    Debris,
    Cleanup,
    LAST,
}
