// TODO not implemented yet
class Random{
    constructor(seed?: number){
        this.seed = seed;
        if (seed === undefined){
            this.seed = Math.random();
        }
    }
    seed: number;
    next(){
        //TODO this is no good
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    split(): Random{
        //TODO
        return new Random();
    }
    deepCopyCreate(){
        //TODO
        var copy = new Random()
        copy.seed = this.seed;
    }
    deepCopyPopulate(){}
}
