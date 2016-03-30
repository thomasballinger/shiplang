
import { Editor, Selection } from './interfaces';

var acorn = require('acorn');
var brace = require('brace');
var Range = <any>(<any>brace).acequire('ace/range').Range

require('brace/mode/javascript');
require('brace/theme/github');

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

        document.getElementById("editor").hidden = false;
        self.editor = brace.edit("editor");
        self.editor.getSession().setMode('ace/mode/javascript');
        self.editor.setTheme('ace/theme/github');
        self.editor.getSession().on('change', function(){self.onChange;});
        self.editor.$blockScrolling = Infinity; // to avoid a console.warning
        self.editor.commands.removeCommand('gotoline') // bound to command-L which selects the url in osx chrome
        self.editor.getSession().setTabSize(2);
        self.editor.getSession().setUseSoftTabs(true);
        self.markers = [];
        self.highlighter = new Highlighter(self.editor.getSession());

        if (self.codeToLoad){
            self.setCode(self.codeToLoad);
            self.codeToLoad = undefined;
        }
    }
    callbacks: any[];
    editor: any;
    markers: any[];
    lastContent: string;
    highlighter: Highlighter;

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
        this.editor.getSession().setValue(s);
        this.onChange();
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
    setHighlightedEntity(id: string){
        //console.log('set highlighted entity called')
        this.highlighter.setActive(id);
    }
    setHighlight(id: string, selections: Selection[]){
        //console.log('set highlight called')
        if (selections.length === 0){
            this.highlighter.clear(id);
        }
        this.highlighter.set(id, selections);
    }
    clearAllHighlights(){
        console.log('clear all highlights called')
        this.highlighter.clearAll();
    }
}

class Highlighter{
    constructor(session: any){
        this.session = session;
        this.highlights = {};
        var stylesheet = document.createElement('style');
        stylesheet.type = 'text/css';
        stylesheet.innerHTML = `.active-entity-highlight { background: rgba(100,150,100,.2);
                                                           z-index: 41;
                                                           position: absolute;}
                                .other-entity-highlight { background: rgba(100,100,150,.2);
                                                          z-index: 40;
                                                          position: absolute;}`;
        document.getElementsByTagName('head')[0].appendChild(stylesheet);
    }

    session: any;
    active: string;
    highlights: {[id: string]: Selection[]};

    setActive(id: string){
        this.active = id;
    }
    set(id: string, selections: Selection[]){

        this.clear(id);
        this.highlights[id]
        if (!this.active){
            this.active = id;
        }
        var code = this.session.getValue();
        var session = this.session;
        var markers = <any[]>[];
        this.highlights[id] = markers;

        var active = this.active;
        selections.map(function(selection: Selection){
            var s = acorn.getLineInfo(code, selection.start);
            var f = acorn.getLineInfo(code, selection.finish);
            var cls = active === id ? "active-entity-highlight" : "other-entity-highlight";
            markers.push(session.addMarker(new (<any>Range)(s.line-1, s.column, f.line-1, f.column),
                                           cls, "text", false));
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
