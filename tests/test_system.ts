/// <reference path="../typings/mocha/mocha.d.ts" />
import { System } from '../system';
import { Entity } from '../entity';
import { assert } from 'chai';

describe('System', () => {
    describe('#copy', () => {
        it("shouldn't create copies that share entities", () => {
            var s1 = new System()
            var l1 = [1,2,3];
            s1.addEntity(<Entity><any>l1)
            var s2 = s1.copy()
            l1.push(4);
            assert.equal((<any>s2.entities[0]).length, 3)
        });
    });
});
