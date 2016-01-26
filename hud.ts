export class Lerper{
    constructor(id: string, public color: string){
        this.canvas = <HTMLCanvasElement>document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.current = 0;
        this.target = 1;
        this.max = undefined;
    }
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    target: number
    current: number
    max: number

    update(current?:number, max?:number){
        if (max === undefined && this.max === undefined){
            throw Error('Need to initialize max value!');
        }
        if (max !== undefined){
            this.max = max;
        }
        if (current !== undefined){
            this.target = current / this.max;
        }
        this.current = (9 * this.current + this.target) / 10
        this.draw();
    }
    draw(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, 0, this.current*this.canvas.width, this.canvas.height);
    }
}

export class FPS{
    constructor(id: string){
        this.div = <HTMLDivElement>document.getElementById(id);
        this.times = [];
        this.fps = 0;
    }
    div: HTMLDivElement;
    times: number[];
    fps: number;
    tick(...rest: any[]){
        var t = new Date().getTime();
        this.times = this.times.filter(function(x){return x > t - 1000});
        this.times.push(t);
        this.fps = this.times.length * 1000 / (t - this.times[0]);
        this.draw(rest);
    }
    draw(info: any[]){
        this.div.innerHTML = ((Math.round(this.fps * 10) / 10).toString() +
                              ' ' + info.map(function(x){ return x.toString() }).join(' '));
    }

}
