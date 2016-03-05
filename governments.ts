import { Gov } from './interfaces';
import { Entity, Ship } from './entity';



export function isEnemy(e1: Entity, e2: Entity){
    if (e1.government === Gov.Player){
        //TODO make this a reputation-based check
        return (e2.government === Gov.Pirate || e2.government === Gov.Debris);
    } else if (e1.government === Gov.Pirate){
        return e2.government !== Gov.Pirate;
    } else if (e1.government === Gov.Cleanup){
        return e2.government === Gov.Debris;
    } else {
        return e2.government === Gov.Pirate;
    }

}

