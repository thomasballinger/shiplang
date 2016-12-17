/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { loadData, parseLine, merge, loadMany } from '../src/dataload';
import { createObjects } from '../src/universe';

var real = require('raw-loader!../data/map.txt') + '\n' + require('raw-loader!../data/ships.txt');

var simple = `
system Sol
	government Trader
	pos 0 0
	fleet "Triangle Patrol"
	object Earth
		color #004000
		radius 40
`

describe('data', () => {
    describe('parseLine', () => {
        it("should split on spaces and quotes", () => {
            assert.deepEqual(parseLine('Something "asf asdf" zxcv asf'),
                         ['Something', 'asf asdf', 'zxcv', 'asf']);
        });
    });
    describe('loadData', () => {
        it('should load data accurately', () => {
            var data = loadData(simple);
            var expected = {
                system: {
                    'Sol': {
                        domain: 'system',
                        id: 'Sol',
                        government: ['Trader'],
                        pos: [ ['0', '0'] ],
                        fleet: ['Triangle Patrol'],
                        object: ['Earth']
                    }
                },
                object: {
                    'Earth': {domain: 'object',
                              id: 'Earth',
                              color: ['#004000'],
                              radius: ['40']
                    }
                }
            }
            assert.deepEqual(data, expected);
        });
        /*
        it('duplicates in same ', () => {
        });
        */
        it('should load real data', () => {
            loadData(real);
        });
    });
});
describe('merge', () => {
    it('should override in subsequent loads', () =>{
        var result = merge(loadData(simple), {'system': {'A': 7}});
        assert.equal(result['system']['A'], 7);
        assert.property(result['system'], 'Sol');
    });
});

describe('data objects', () => {
    it('should create objects from full data', () => {
        var data = loadData(real)
        createObjects(data);
    })
})

describe('Spobs', () => {
    it('should calculate positions of descendents', () => {
        var Sol = createObjects(loadData(real)).systems['Sol'];
        var spots = Sol.spobSpots(0);
        // earth has a moon that should also be in the list
        assert(spots.length > Sol.spobs.length);
    });
});
