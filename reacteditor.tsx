
import * as React from 'react';
import { render } from 'react-dom'
import AceEditor from 'react-ace';

// this seems to be expected by the solarize_light mode?

require('brace/mode/javascript');
require('brace/theme/github');
//import 'brace/theme/solarized_light';


export function makeReactEditor(delayedInit: (editor: any)=>void,
                                onChange: (s: string)=>void){
    // Render first editor
    render(
      <AceEditor
        mode="javascript"
        theme="github"
        name="editor"
        onChange={onChange}
        onLoad={delayedInit}
      />,
      document.getElementById('editor-container')
    );
}
