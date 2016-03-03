/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Mission, MissionStatic } from '../mission';
import * as missions from '../missions';

interface moduleOfMissions {
    [key: string]: MissionStatic;
}

describe('Missions', () => {
    for (var missionName of <string[]>['KillGiveAstroidsMission',
                                       'DontKillCiviliansMission']){
        it("can be round-trip serialized", () => {
            var missionClass = (<moduleOfMissions><any>missions)[missionName];
            var m = new missionClass
            var data = m.save();
            var reconstitutedData = JSON.parse(JSON.stringify(data));
            assert.deepEqual(data, reconstitutedData)
        });
    }
});
