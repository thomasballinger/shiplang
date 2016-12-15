/** Loads data into JSON*/

export interface Domains{
    [domain: string]: {[id: string]: any};
}

function isNumber(n: string) {
  return !isNaN(parseFloat(n)) && isFinite(<any>n);
}

// should follow the behavior described in
// https://github.com/endless-sky/endless-sky/wiki/CreatingPlugins

export function loadData(text: string): Domains {
    if (text.search('  ') > -1){ throw Error("Found 2 spaces instead of tabs in file!"); }
    var domains: Domains = {};

    var stack: any[] = [];
    var lastLine = '';
    var lines = dataLines(text);
    lines.push([0, 'ENDOFDATA']);

    for (var [indent, line] of lines){
        //console.log('processing line: ', line);
        //console.log('stack state: ', JSON.parse(JSON.stringify(stack)));

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
                // Probably a name, but some headings have two members
                // where the second isn't a name, but a data number
                // (namely "variant"
                if (isNumber(lastTokens[1])){
                    stack[stack.length-1].weight = parseInt(lastTokens[1]);
                } else {
                    stack[stack.length-1].id = lastTokens[1];
                }
            }
        // The same or less indentation as the previous line
        } else if (indent < stack.length){
            // add previous line as data element
            var lastTokens = stack.pop();

            if (lastTokens.length === 0){ throw Error('huh?'+lastLine)}
            if (!stack[stack.length-1].hasOwnProperty(lastTokens[0])){
                stack[stack.length-1][lastTokens[0]] = [];
            }
            var value = (lastTokens.length === 2 ? lastTokens[1] :
                        (lastTokens.length === 1 ? undefined : lastTokens.slice(1)))
            stack[stack.length-1][lastTokens[0]].push(value);

            // less indentation that previous line
            while (stack.length > indent){
                var object = stack.pop();
                if (stack.length === 0 && !object.id){
                    throw Error('please name stuff at the top level: '+object);
                }

                if (object.id){
                    //console.log('going to save', object, 'globally');
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
            //console.log('after line', line);
            //console.log(JSON.parse(JSON.stringify(stack)));
            return domains;
        }
        stack.push(parseLine(line))
        //console.log('after line', line);
        //console.log(JSON.parse(JSON.stringify(stack)));
        lastLine = line;
    }

    return domains;
}

/** Override data in acc with data in next */
export function merge(acc: Domains, next: Domains): Domains{
    for (var domain of Object.keys(next)){
        if (acc[domain] === undefined){
            acc[domain] = {};
        }
        for (var id of Object.keys(next[domain])){
            //TODO write merge code as needed
            //     right now new data overrides old
            acc[domain][id] = next[domain][id];
        }
    }
    return acc;
}

/** Load structured data loads */
export function loadMany(data: Domains[]){
    return data.reduce((acc: Domains, stuff: Domains): Domains => {
        return merge(acc, stuff);
    })
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
    function notComment(line: string){ return !(line.trim().slice(0, 1) === '#'); }
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
