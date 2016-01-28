var ace = require('brace');
require('brace/mode/scheme');
require('brace/mode/javascript');
require('brace/theme/terminal');

interface Editor {
    getCode(): string;
    setCode(s: any): void;
    setListener(cb: ()=>void): void;
}

export class AceSL {
    constructor(){
        this.editor = ace.edit('editor');
        this.editor.getSession().setMode('ace/mode/scheme');
        this.editor.setTheme('ace/theme/terminal');
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
        this.editor.setTheme('ace/theme/terminal');
        var self = this;
        this.editor.getSession().on('change', function(){self.onChange();});
        this.callbacks = []
    }
    callbacks: any[];
    editor: any;
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
