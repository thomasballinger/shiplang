import { Entity } from './entity';
import { CompiledFunctionObject, BC } from './eval';
import { SpaceWorld } from './space';

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

export type Script = ((e: Entity)=>Generator)|string|CompiledFunctionObject

export type ByteCode = [BC, any];

export interface WorldBuilder {
    (scripts: any): SpaceWorld;
    instructions: string
}
