import registerEdit from './edits'
import {Emitter} from './emitter';

import {
    DefaultContext,
    DefaultVariables,
} from './molang_data'
import { forEachInput } from './input_structure';


export function updateVariablePlaceholderList(list) {
    list.splice(0, Infinity);

    let molang_strings = [];
    forEachInput((input) => {
        if (input.type != 'molang') return;
        if (input.value instanceof Array) {
            for (let string of input.value) {
                molang_strings.push(string);
            }

        } else if (typeof input.value == 'string') {
            molang_strings.push(input.value);
        }
    })
    let variable_ids = new Set();
    let predefined = new Set();
    for (let string of molang_strings) {
        if (typeof string != 'string') continue;
        let string_lower_case = string.toLowerCase();
        let matches = string_lower_case.match(/(v|variable|c|context)\.[\w.]+\b/g);
        if (!matches) continue;
        for (let match of matches) {
            let key = match.replace(/^v\./, 'variable.').replace(/^c\./, 'context.');
            let key_short = key.replace(/^variable\./g, 'v.').replace(/^context\./g, 'c.');
            variable_ids.add(key);
            let assign_regex = new RegExp(`(${key.replace('.', '\\.')}|${key_short.replace('.', '\\.')})\\s*=[^=]`, 'g');
            if (string.match(assign_regex)) {
                predefined.add(key);
            }
        }
    }
    for (let id of variable_ids) {
        if (DefaultVariables.find(v => ('variable.'+v) == id) || DefaultContext.find(v => ('context.'+v) == id)) continue;
        let key_short = id.replace(/^variable\./g, 'v.').replace(/^context\./g, 'c.');
        if (Emitter.config.curves[id] || Emitter.config.curves[key_short]) continue;
        if (predefined.has(id)) continue;
        list.push(id);
    }
}
export function bakePlaceholderVariable(key, value) {
    let key_short = key.replace(/^variable\./g, 'v.').replace(/^context\./g, 'c.');
    let regex = new RegExp(`\\b(${key.replace('.', '\\.')}|${key_short.replace('.', '\\.')})\\b`, 'g');
    function update(string) {
        if (typeof string != 'string') return string;
        return string.replace(regex, value);
    }
    forEachInput((input) => {
        if (input.type != 'molang') return;
        if (input.value instanceof Array) {
            input.set(input.value.map(update));
        } else {
            input.set(update(input.value));
        }
    })
    registerEdit('bake placeholder variables')
}
