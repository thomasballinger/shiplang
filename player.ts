export class Player{
    constructor(data: any){
        for (var prop of Object.keys(data)){
            console.log("setting", prop, 'to', data[prop]);
            (<any>this)[prop] = data[prop];
        }
    }
    static fromStorage(): Player{
        var data = localStorage.getItem('player')
        if (data === null){ return Player.newPlayer(); }
        var player = Player.fromJson(data);
        (<any>window).player = player;
        return player;
    }
    static fromJson(data: string): Player{
        return new Player(JSON.parse(data));
    }
    toJson(): string{
        return JSON.stringify(this);
    }
    static newPlayer(): Player{
        return new Player({
            _spaceLocation: [100, 100],
            _location: '',
            _name: 'Slippy',
        })
    }
    static go(){
        (<any>window).location.reload();
    }
    save(){
        var data = localStorage.setItem('player', this.toJson());
        localStorage.setItem('player', this.toJson());
    }
    static clear(){
        localStorage.removeItem('player');
    }
    //TODO fancy proxy stuff? Use function?
    //Every access should cause a save.
    get location(){
        return this._location;
    }
    set location(value: string){
        this._location = value;
        this.save();
    }
    get spaceLocation(){
        return this._spaceLocation
    }
    set spaceLocation(value: [number, number]){
        this._spaceLocation = value;
        this.save();
    }

    // schema for objects:
    _spaceLocation: [number, number];
    _name: string;
    _location: string;
}

