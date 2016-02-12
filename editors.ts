var acorn = (<any>window).acorn;

import { Editor, Selection } from './interfaces';
import { makeReactEditor } from './reacteditor';

var brace = require('brace');
var Range = <any>(<any>brace).acequire('ace/range').Range

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
        this.callbacks = [];
        this.lastContent = '';

        var self = this;
        function delayedInit(editor: any){
            self.editor = editor;
            self.editor.getSession().on('change', function(){self.onChange;});
            self.editor.$blockScrolling = Infinity; // to avoid a console.warning
            self.editor.commands.removeCommand('gotoline') // bound to command-L which selects the url in osx chrome
            self.editor.getSession().setTabSize(2);
            self.editor.getSession().setUseSoftTabs(true);
            self.markers = [];
            self.highlighter = new Highlighter(self.editor.getSession());

            self.loaded = true;

            if (self.codeToLoad){
                self.setCode(self.codeToLoad);
                self.codeToLoad = undefined;
            }
        }
        makeReactEditor(delayedInit, function(s: string){ self.onChange(); });
    }
    callbacks: any[];
    editor: any;
    markers: any[];
    lastContent: string;
    highlighter: Highlighter;

    loaded: boolean;
    codeToLoad: string;

    refresh(): boolean{
        var s = this.editor.getSession().getValue();
        if (s === this.lastContent){
            return false;
        } else {
            this.lastContent = s;
            return true;
        }
    }
    getCode(): string{
        return this.lastContent;
    }
    setCode(s: string){
        if (this.loaded){
            this.editor.getSession().setValue(s);
            this.onChange();
        } else {
            this.codeToLoad = s;
        }
    }
    setListener(cb: ()=>void){
        this.callbacks.push(cb);
    }
    onChange(){
        if (!this.refresh()){
            //TODO this extra indirection is unnecessary
            return;
        }
        for (var i=0; i<this.callbacks.length; i++){
            this.callbacks[0]();
        }
    }
    // interface used by Contexts
    setHighlight(id: string, selections: Selection[]){
        if (!this.loaded){ return; }
        if (selections.length === 0){
            this.highlighter.clear(id);
        }
        this.highlighter.set(id, selections, '#aabbcc');
    }
    clearAllHighlights(){
        if (!this.loaded){ return; }
        this.highlighter.clearAll();
    }
}

class Highlighter{
    constructor(session: any){
        this.session = session;
        this.highlights = {};
    }
    session: any;
    highlights: {[id: string]: Selection[]};
    // replace previous highlights for id with these
    set(id: string, selections: Selection[], color: string){
        this.clear(id);
        this.highlights[id]

        var code = this.session.getValue();
        var session = this.session;
        var markers = <any[]>[];
        this.highlights[id] = markers;
        selections.map(function(selection: Selection){
            var s = acorn.getLineInfo(code, selection.start);
            var f = acorn.getLineInfo(code, selection.finish);
            markers.push(session.addMarker(new (<any>Range)(s.line-1, s.column, f.line-1, f.column), "running-code", "text", false));
        });
    }
    // clears all annotations on e.g. world reset
    clear(id: string){
        if (!this.highlights.hasOwnProperty(id)){ return; }
        var session = this.session;
        this.highlights[id].map(function(x){
            session.removeMarker(x);
        });
        delete this.highlights[id];
    }
    // clears annotations for an id e.g. on entity death
    clearAll(){
        for (var key of Object.keys(this.highlights)){
            this.clear(key);
        }
    }
}

//editor.setValue(pilotScriptSource);


// highlight
// called with an entity and a range.
// on death, clear
// highlighter.set
// highlighter.clear
// highlighter

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
