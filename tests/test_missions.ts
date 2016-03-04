/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Mission, MissionStatic, missions } from '../mission';

interface moduleOfMissions {
    [key: string]: MissionStatic;
}

describe('Missions', () => {
    it("can be round-trip serialized", () => {
        for (var missionName of Object.keys(missions)){
            var missionClass = missions[missionName];
            var m = new missionClass();
            var data = m.save();
            var reconstitutedData = JSON.parse(JSON.stringify(data));
            assert.deepEqual(data, reconstitutedData)
        }
    });
});
