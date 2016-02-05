var ace = require('brace');
var Range = ace.acequire('ace/range').Range
require('brace/mode/scheme');
require('brace/mode/javascript');
require('brace/theme/dawn');
var acorn = require('acorn');

interface Editor {
    getCode(): string;
    setCode(s: any): void;
    setListener(cb: ()=>void): void;
}

interface Selection {
    start: number;
    finish: number;
}

export class AceSL {
    constructor(){
        this.editor = ace.edit('editor');
        this.editor.getSession().setMode('ace/mode/scheme');
        this.editor.setTheme('ace/theme/dawn');
    }
    editor: any;
    getCode(): string{ return this.editor.getSession().getValue(); }
    setCode(s: string){
        return this.editor.getSession().setValue(s);
    }
    setListener(cb: ()=>void){
        this.editor.getSession().on('change', cb);
    }
}

export class AceJS {
    constructor(){
        this.editor = ace.edit('editor');
        this.editor.getSession().setMode('ace/mode/javascript');
        this.editor.setTheme('ace/theme/dawn');
        var self = this;
        this.editor.getSession().on('change', function(){self.onChange();});
        this.callbacks = []
        this.editor.$blockScrolling = Infinity; // to avoid a console.warning
        this.markers = [];
    }
    callbacks: any[];
    editor: any;
    markers: any[];
    getCode(): string{ return this.editor.getSession().getValue(); }
    setCode(s: string){
        this.editor.getSession().setValue(s);
        this.onChange();
    }
    setListener(cb: ()=>void){
        this.callbacks.push(cb);
    }
    onChange(){
        for (var i=0; i<this.callbacks.length; i++){
            this.callbacks[0]();
        }
    }
    highlight(selections: Selection[]){
        var session = this.editor.getSession();
        this.markers.map(function(x){
            session.removeMarker(x);
        });
        var code = session.getValue();
        this.markers = [];
        var markers = this.markers;
        selections.map(function(selection: Selection){
            var s = acorn.getLineInfo(code, selection.start);
            var f = acorn.getLineInfo(code, selection.finish);
            markers.push(session.addMarker(new Range(s.line-1, s.column, f.line-1, f.column), "running-code", "text", false));
        });
    }
}

//editor.setValue(pilotScriptSource);


export class BlocklySL {
    constructor(id: string){
        if (!(<any>window).Blockly){ throw Error('Blockly not loaded!'); }
        createBlocklyToolbox();
        this.workspace = (<any>window).Blockly.inject('editor',
            {toolbox: document.getElementById('toolbox')});
    }
    workspace: any;
    getCode(){
        return (<any>window).Blockly.ShipLang.workspaceToCode(this.workspace);
    }
    setListener(cb: ()=>void){
        this.workspace.addChangeListener(cb);
    }
}

function createBlocklyToolbox(){
    var toolboxXML = require("raw!./blocklySLtoolbox.xml");
    var node = document.createElement('div');
    node.innerHTML = toolboxXML;
    console.log(node);
    document.body.appendChild(node);
}
