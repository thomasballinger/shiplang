import { Gov } from './interfaces';
import { Entity, Ship } from './entity';



export function isEnemy(e1: Entity, e2: Entity){
    if (e1.government === 'player'){
        //TODO make this a reputation-based check
        return (e2.government === 'pirate' || e2.government === 'debris');
    } else if (e1.government === 'pirate'){
        return e2.government !== 'pirate';
    } else if (e1.government === 'cleanup'){
        return e2.government === 'debris';
    } else {
        return e2.government === 'pirate';
    }

}

