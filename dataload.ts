/** Loads data into JSON*/

interface Domains{
    [domain: string]: {[id: string]: any};
}

export function loadData(text: string): Domains {
    var domains: Domains = {};

    var stack: any[] = [];
    var lastLine = '';
    var lines = dataLines(text);
    lines.push([0, 'ENDOFDATA']);

    for (var [indent, line] of lines){
        //if (indent !== stack.length){ throw Error('wrong indent'); }
        //if (tokens.length < 1 || tokens.length > 2){ throw Error('wrong lengths of tokens: '+tokens); }

        if (stack.length === 0){
            if (indent){ throw Error('wrong indent for line: '+line); }

        // More than one level more indented than the previous line
        } else if (indent > stack.length){
            throw Error("Too much indentation: "+line);

        // One level more indented than the previous line
        } else if (indent === stack.length){
            var lastTokens = stack.pop();
            if (lastTokens.length > 2){
                throw Error("Too many tokens for heading: "+lastLine);
            }
            if (lastTokens.length === 0){ throw Error('huh?'+lastLine)}
            stack.push({domain: lastTokens[0]});
            if (lastTokens.length === 2){
                stack[stack.length-1].id = lastTokens[1];
            }

        // The same or less indentation as the previous line
        } else if (indent < stack.length){
            // add previous line as data element
            var lastTokens = stack.pop();

            if (lastTokens.length === 0){ throw Error('huh?'+lastLine)}
            if (!stack[stack.length-1].hasOwnProperty(lastTokens[0])){
                stack[stack.length-1][lastTokens[0]] = [];
            }
            stack[stack.length-1][lastTokens[0]].push(lastTokens.length == 2 ?
                                                      lastTokens[1] :
                                                      lastTokens.slice(1));

            // less indentation that previous line
            while (stack.length > indent){
                var object = stack.pop();
                if (stack.length === 0 && !object.id){
                    throw Error('please name stuff at the top level: '+object);
                }

                if (object.id){
                    console.log('going to save', object, 'globally');
                    if (!domains.hasOwnProperty(object.domain)){
                        domains[object.domain] = {};
                    }
                    domains[object.domain][object.id] = object;
                }
                if (stack.length > 0){
                    if (!stack[stack.length-1].hasOwnProperty(object.domain)){
                        stack[stack.length-1][object.domain] = [];
                    }
                    stack[stack.length-1][object.domain].push(object.id ?
                                                              object.id :
                                                              object);
                }
            }
        }

        if (line === 'ENDOFDATA'){
            console.log('after line', line);
            console.log(JSON.parse(JSON.stringify(stack)));
            return domains;
        }
        stack.push(parseLine(line))
        console.log('after line', line);
        console.log(JSON.parse(JSON.stringify(stack)));
        lastLine = line;
    }

    return domains;
}

export function parseLine(line: string){
    return <string[]>(line.match(/"[^"]*"|[^ ]+/g) || []).map(function(match){
        return (match[0] === '"' && match[match.length-1] === '"' && match.length > 1 ?
                match.slice(1, -1) : match)
    });
}

function dataLines(text: string): [number, string][]{
    var lines = text.split(/[\r\n]+/g);
    function notJustWhitespace(line: string){ return !!line.trim() }
    function notComment(line: string){ return !line.trim().startsWith('#'); }
    function indentAndLine(line: string): [number, string]{
        var indent = line.match(/[\t]*/)[0].length;
        return [indent, line.trim()];
    }
    return lines.filter(notJustWhitespace).filter(notComment).map(indentAndLine);
}



/*
 * Two-step process: first build JSON in this format, then actually
 * instantiated classes as necessary.
 */
