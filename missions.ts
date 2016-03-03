import { Ship } from './entity';
import { Mission, Event, EventType } from './mission';

export class KillFiveAstroidsMission extends Mission {
    initializeData(){
        this.data = {killed: 0}
    }
    processEvent(e: Event){
        if (e.type === EventType.Kill &&
            e.actor.government === 'player' &&
            e.target.government === 'debris'){
            this.data['killed'] += 1
        }
    }
}

export class DontAttackCiviliansMission extends Mission {
    initializeData(){
        this.data = {killed: 0}
    }
    processEvent(e: Event){
        if (e.type === EventType.Provoke &&
            e.actor.government === 'player' &&
            e.target.government === 'citizen'){
            //TODO clean up civilian -> civilian or something
            this.data['killed'] += 1
        }
    }
}
