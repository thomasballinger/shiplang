var ace = require('brace');
require('brace/mode/scheme');
require('brace/theme/terminal');

interface Editor {
    getCode(): string;
    setListener(cb: ()=>void): void;
}

export class AceSL {
    constructor(){
        this.editor = ace.edit('editor');
        this.editor.getSession().setMode('ace/mode/scheme');
        this.editor.setTheme('ace/theme/terminal');
    }
    editor: any;
    getCode(){
        return this.editor.getSession().getValue();
    }
    setListener(cb: ()=>void){
        this.editor.getSession().on('change', cb);
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
