window.Dropin.declare('dropin_modules/dropin-t7-react', function* (dReq, DropinUtils) {
    const process = { 'env': {} }, $DROPIN_EXTERN$ = { 'react': yield dReq('react') }, $DROPIN_MODS$ = {
            1: {
                define: function (require, module, exports) {
                    const React = require('react');
                    var t7 = function () {
                        'use strict';
                        var isBrowser = true;
                        var docHead = null;
                        var output = null;
                        var precompile = false;
                        var version = '0.3.0';
                        if (isBrowser === true) {
                            docHead = document.getElementsByTagName('head')[0];
                        }
                        var selfClosingTags = {
                            area: true,
                            base: true,
                            basefont: true,
                            br: true,
                            col: true,
                            command: true,
                            embed: true,
                            frame: true,
                            hr: true,
                            img: true,
                            input: true,
                            isindex: true,
                            keygen: true,
                            link: true,
                            meta: true,
                            param: true,
                            source: true,
                            track: true,
                            wbr: true,
                            path: true,
                            circle: true,
                            ellipse: true,
                            line: true,
                            rect: true,
                            use: true,
                            stop: true,
                            polyline: true,
                            polygon: true
                        };
                        function buildUniversalChildren(root, tagParams, childrenProp, component) {
                            var childrenText = [];
                            var i = 0;
                            var n = 0;
                            var key = '';
                            var matches = null;
                            if (root.children != null && root.children instanceof Array) {
                                for (i = 0, n = root.children.length; i < n; i++) {
                                    if (root.children[i] != null) {
                                        if (typeof root.children[i] === 'string') {
                                            root.children[i] = root.children[i].replace(/(\r\n|\n|\r)/gm, '');
                                            matches = root.children[i].match(/__\$props__\[\d*\]/g);
                                            if (matches !== null) {
                                                childrenText.push(root.children[i]);
                                            } else {
                                                childrenText.push('\'' + root.children[i] + '\'');
                                            }
                                        } else {
                                            buildFunction(root.children[i], childrenText, component);
                                        }
                                    }
                                }
                                if (childrenText.length === 1) {
                                    tagParams.push((childrenProp ? 'children: ' : '') + childrenText);
                                } else if (childrenText.length > 1) {
                                    tagParams.push((childrenProp ? 'children: ' : '') + '[' + childrenText.join(',') + ']');
                                }
                            } else if (root.children != null && typeof root.children === 'string') {
                                root.children = root.children.replace(/(\r\n|\n|\r)/gm, '').trim();
                                matches = root.children.match(/__\$props__\[\d*\]/g);
                                if (matches !== null) {
                                    root.children = root.children.replace(/(__\$props__\[.*\])/g, '\',$1,\'');
                                }
                                if (root.children.substring(root.children.length - 2) === ',\'') {
                                    true;
                                    tagParams.push((childrenProp ? 'children: ' : '') + '[\'' + root.children + ']');
                                } else {
                                    tagParams.push((childrenProp ? 'children: ' : '') + '[\'' + root.children + '\']');
                                }
                            }
                        }
                        ;
                        function buildInfernoTemplate(root, valueCounter, parentNodeName, templateValues, templateParams, component) {
                            var nodeName = parentNodeName ? parentNodeName + '_' : 'n_';
                            var child = null, matches, valueName = '';
                            if (root.children instanceof Array) {
                                for (var i = 0; i < root.children.length; i++) {
                                    child = root.children[i];
                                    if (typeof child === 'string' && root.children.length === 1) {
                                        matches = child.match(/__\$props__\[\d*\]/g);
                                        if (matches === null) {
                                            if (!parentNodeName) {
                                                templateParams.push('root.textContent=(\'' + child + '\');');
                                            } else {
                                                templateParams.push(parentNodeName + '.textContent=\'' + child + '\';');
                                            }
                                        } else {
                                            valueName = 'fragment.templateValues[' + valueCounter.index + ']';
                                            templateParams.push('if(typeof ' + valueName + ' !== \'object\') {');
                                            if (!parentNodeName) {
                                                templateParams.push('root.textContent=' + valueName + ';');
                                            } else {
                                                templateParams.push(parentNodeName + '.textContent=(' + valueName + ' === \'\' ? \' \' : ' + valueName + ');');
                                            }
                                            templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.TEXT;');
                                            templateParams.push('} else {');
                                            templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = (' + valueName + '.constructor === Array ? Inferno.Type.LIST : Inferno.Type.FRAGMENT);');
                                            templateParams.push('}');
                                            if (!parentNodeName) {
                                                templateParams.push('fragment.templateElements[' + valueCounter.index + '] = root;');
                                            } else {
                                                templateParams.push('fragment.templateElements[' + valueCounter.index + '] = ' + parentNodeName + ';');
                                            }
                                            templateValues.push(child);
                                            valueCounter.index++;
                                        }
                                    } else if (typeof child === 'string' && root.children.length > 1) {
                                        matches = child.match(/__\$props__\[\d*\]/g);
                                        if (matches === null) {
                                            templateParams.push('var ' + nodeName + i + ' = Inferno.dom.createText(\'' + child.replace(/(\r\n|\n|\r)/gm, '') + '\');');
                                        } else {
                                            valueName = 'fragment.templateValues[' + valueCounter.index + ']';
                                            templateParams.push('var ' + nodeName + i + ';');
                                            templateParams.push('if(typeof ' + valueName + ' !== \'object\') {');
                                            templateParams.push(nodeName + i + ' = Inferno.dom.createText(' + valueName + ');');
                                            templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.TEXT_DIRECT;');
                                            templateParams.push('} else {');
                                            templateParams.push(nodeName + i + ' = Inferno.dom.createEmpty();');
                                            templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = (' + valueName + '.constructor === Array ? Inferno.Type.LIST_REPLACE : Inferno.Type.FRAGMENT_REPLACE);');
                                            templateParams.push('}');
                                            templateParams.push('fragment.templateElements[' + valueCounter.index + '] = ' + nodeName + i + ';');
                                            templateValues.push(child);
                                            valueCounter.index++;
                                        }
                                        if (!parentNodeName) {
                                            templateParams.push('root.appendChild(' + nodeName + i + ');');
                                        } else {
                                            templateParams.push(parentNodeName + '.appendChild(' + nodeName + i + ');');
                                        }
                                    } else if (child != null) {
                                        if (child.tag) {
                                            if (isComponentName(child.tag) === true) {
                                                valueCounter.t7Required = true;
                                                var props = [];
                                                var propRefs = [];
                                                var childHelper = infernoTemplateHelper.bind(null, child, nodeName + i, templateValues, templateParams, valueCounter, propRefs);
                                                var childAttrs = joinAttrs(child.assignments, childHelper);
                                                templateParams.push('var ' + nodeName + i + ' = Inferno.dom.createComponent(' + (!parentNodeName ? 'root' : parentNodeName) + ', t7.loadComponent(\'' + child.tag + '\'), ' + childAttrs + ');');
                                                templateParams.push(propRefs.join(''));
                                            } else {
                                                templateParams.push('var ' + nodeName + i + ' = Inferno.dom.createElement(\'' + child.tag + '\');');
                                                if (child.assignments) {
                                                    var infernoHelper = infernoTemplateHelper.bind(null, child, nodeName + i, templateValues, templateParams, valueCounter, null);
                                                    templateParams.push('Inferno.dom.addAttributes(' + nodeName + i + ', ' + joinAttrs(root.assignments, infernoHelper) + ');');
                                                }
                                                if (child.children) {
                                                    buildInfernoTemplate(child, valueCounter, nodeName + i, templateValues, templateParams, component);
                                                }
                                                if (!parentNodeName) {
                                                    templateParams.push('root.appendChild(' + nodeName + i + ');');
                                                } else {
                                                    templateParams.push(parentNodeName + '.appendChild(' + nodeName + i + ');');
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        function buildReactChildren(root, tagParams, childrenProp, component) {
                            var childrenText = [];
                            var i = 0;
                            var n = 0;
                            var matches = null;
                            if (root.children != null && root.children instanceof Array) {
                                for (i = 0, n = root.children.length; i < n; i++) {
                                    if (root.children[i] != null) {
                                        if (typeof root.children[i] === 'string') {
                                            root.children[i] = root.children[i].replace(/(\r\n|\n|\r)/gm, '');
                                            matches = root.children[i].match(/__\$props__\[\d*\]/g);
                                            if (matches != null) {
                                                root.children[i] = root.children[i].replace(/(__\$props__\[[0-9]*\])/g, '$1');
                                                if (root.children[i].substring(root.children[i].length - 1) === ',') {
                                                    root.children[i] = root.children[i].substring(0, root.children[i].length - 1);
                                                }
                                                childrenText.push(root.children[i]);
                                            } else {
                                                childrenText.push('\'' + root.children[i] + '\'');
                                            }
                                        } else {
                                            buildFunction(root.children[i], childrenText, i === root.children.length - 1, component);
                                        }
                                    }
                                }
                                if (childrenText.length > 0) {
                                    tagParams.push(childrenText.join(','));
                                }
                            } else if (root.children != null && typeof root.children === 'string') {
                                root.children = root.children.replace(/(\r\n|\n|\r)/gm, '');
                                tagParams.push('\'' + root.children + '\'');
                            }
                        }
                        ;
                        function infernoTemplateHelper(root, rootElement, templateValues, templateParams, valueCounter, propRefs, name, val) {
                            var valueName = 'fragment.templateValues[' + valueCounter.index + ']';
                            if (!propRefs) {
                                switch (name) {
                                case 'class':
                                case 'className':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_CLASS;');
                                    break;
                                case 'id':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_ID;');
                                    break;
                                case 'value':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_VALUE;');
                                    break;
                                case 'width':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_WIDTH;');
                                    break;
                                case 'height':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_HEIGHT;');
                                    break;
                                case 'type':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_TYPE;');
                                    break;
                                case 'name':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_NAME;');
                                    break;
                                case 'href':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_HREF;');
                                    break;
                                case 'disabled':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_DISABLED;');
                                    break;
                                case 'checked':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_CHECKED;');
                                    break;
                                case 'selected':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_SELECTED;');
                                    break;
                                case 'label':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_LABEL;');
                                    break;
                                case 'style':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_STYLE;');
                                    break;
                                case 'placeholder':
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_PLACEHOLDER;');
                                    break;
                                default:
                                    templateParams.push('if(Inferno.Type.ATTR_OTHER.' + name + ' === undefined) { Inferno.Type.ATTR_OTHER.' + name + ' = \'' + name + '\'; }');
                                    templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.ATTR_OTHER.' + name + ';');
                                    break;
                                }
                                templateParams.push('fragment.templateElements[' + valueCounter.index + '] = ' + rootElement + ';');
                            } else {
                                templateParams.push('if(Inferno.Type.COMPONENT_PROPS.' + name + ' === undefined) { Inferno.Type.COMPONENT_PROPS.' + name + ' = \'' + name + '\'; }');
                                templateParams.push('fragment.templateTypes[' + valueCounter.index + '] = Inferno.Type.COMPONENT_PROPS.' + name + ';');
                                propRefs.push('fragment.templateElements[' + valueCounter.index + '] = ' + rootElement + ';');
                            }
                            templateValues.push(val);
                            valueCounter.index++;
                        }
                        function isComponentName(tagName) {
                            if (tagName[0] === tagName[0].toUpperCase()) {
                                return true;
                            }
                            return false;
                        }
                        ;
                        function joinAttrs(assignments, boundTemplateHelper) {
                            if (!assignments || !assignments.length)
                                return '{}';
                            var str = 'Object.assign(';
                            var insideLiteral = false;
                            var matches = null;
                            for (var i = 0, n = assignments.length; i < n; i++) {
                                var it = assignments[i];
                                if (typeof it === 'string') {
                                    if (insideLiteral) {
                                        str += ' },';
                                        insideLiteral = false;
                                    }
                                    str += it;
                                    if (i < n - 1)
                                        str += ', ';
                                } else {
                                    if (!insideLiteral) {
                                        str += '{ ';
                                        insideLiteral = true;
                                    }
                                    matches = it[1].match(/__\$props__\[\d*\]/g);
                                    if (matches === null) {
                                        str += '\'' + it[0] + '\':\'' + it[1] + '\',';
                                    } else {
                                        str += '\'' + it[0] + '\':' + it[1] + ',';
                                        if (boundTemplateHelper)
                                            boundTemplateHelper(it[0], it[1]);
                                    }
                                }
                            }
                            return str + (insideLiteral ? ' })' : ')');
                        }
                        function buildFunction(root, functionText, component, templateKey) {
                            var i = 0;
                            var tagParams = [];
                            var literalParts = [];
                            var attrsValueKeysParams = [];
                            if (root instanceof Array) {
                            } else {
                                if (output === t7.Outputs.Universal || output === t7.Outputs.Mithril) {
                                } else if (output === t7.Outputs.Inferno) {
                                } else if (output === t7.Outputs.React) {
                                    if (root.tag != null) {
                                        if (isComponentName(root.tag) === true) {
                                            if ((typeof window != 'undefined' && component === window || component == null) && precompile === false) {
                                                throw new Error('Error referencing component \'' + root.tag + '\'. Components can only be used when within modules. See documentation for more information on t7.module().');
                                            }
                                            functionText.push('React.createElement(__$components__.' + root.tag);
                                        } else {
                                            functionText.push('React.createElement(\'' + root.tag + '\'');
                                        }
                                        if (root.assignments != null) {
                                            tagParams.push(joinAttrs(root.assignments));
                                        } else {
                                            tagParams.push('null');
                                        }
                                        buildReactChildren(root, tagParams, true, component);
                                        functionText.push(tagParams.join(',') + ')');
                                    } else {
                                        root = root.replace(/(\r\n|\n|\r)/gm, '\\n');
                                        functionText.push('\'' + root + '\'');
                                    }
                                }
                            }
                        }
                        ;
                        function handleChildTextPlaceholders(childText, parent, onlyChild) {
                            var i = 0;
                            var parts = childText.split(/(__\$props__\[\d*\])/g);
                            for (i = 0; i < parts.length; i++) {
                                if (parts[i].trim() !== '') {
                                    parent.children.push(parts[i]);
                                }
                            }
                            childText = null;
                            return childText;
                        }
                        ;
                        function replaceQuotes(string) {
                            if (string.indexOf('\'') > -1) {
                                string = string.replace(/'/g, '\\\'');
                            }
                            return string;
                        }
                        ;
                        function applyValues(string, values) {
                            var index = 0;
                            var re = /__\$props__\[([0-9]*)\]/;
                            var placeholders = string.match(/__\$props__\[([0-9]*)\]/g);
                            if (placeholders != null) {
                                for (var i = 0; i < placeholders.length; i++) {
                                    index = re.exec(placeholders[i])[1];
                                    string = string.replace(placeholders[i], values[index]);
                                }
                            }
                            return string;
                        }
                        ;
                        function getVdom(html, values) {
                            var char = '';
                            var lastChar = '';
                            var i = 0;
                            var n = 0;
                            var root = null;
                            var insideTag = false;
                            var tagContent = '';
                            var tagName = '';
                            var vElement = null;
                            var childText = '';
                            var parent = null;
                            var tagData = null;
                            var skipAppend = false;
                            var newChild = null;
                            var hasRootNodeAlready = false;
                            for (i = 0, n = html.length; i < n; i++) {
                                char = html[i];
                                if (char === '<') {
                                    insideTag = true;
                                } else if (char === '>' && insideTag === true) {
                                    if (tagContent[0] === '/') {
                                        if (tagContent !== '/' + parent.tag && !selfClosingTags[parent.tag] && !parent.closed) {
                                            console.error('Template error: ' + applyValues(html, values));
                                            throw new Error('Expected corresponding t7 closing tag for \'' + parent.tag + '\'.');
                                        }
                                        if (childText.trim() !== '') {
                                            childText = replaceQuotes(childText);
                                            childText = handleChildTextPlaceholders(childText, parent, true);
                                            if (childText !== null && parent.children.length === 0) {
                                                parent.children = childText;
                                            } else if (childText != null) {
                                                parent.children.push(childText);
                                            }
                                        }
                                        parent = parent.parent;
                                        if (parent) {
                                            parent.closed = true;
                                        }
                                    } else {
                                        if (childText.trim().length > 0 && !(parent instanceof Array)) {
                                            childText = replaceQuotes(childText);
                                            childText = handleChildTextPlaceholders(childText.replace(/(\r\n|\n|\r)/gm, ''), parent);
                                            parent.children.push(childText);
                                            childText = '';
                                        }
                                        if (tagContent.indexOf(' ') === -1) {
                                            tagData = {};
                                            tagName = tagContent;
                                        } else {
                                            tagData = getTagData(tagContent);
                                            tagName = tagData.tag;
                                        }
                                        vElement = {
                                            tag: tagName,
                                            assignments: tagData && tagData.assignments ? tagData.assignments : null,
                                            children: [],
                                            closed: tagContent[tagContent.length - 1] === '/' || selfClosingTags[tagName] ? true : false
                                        };
                                        if (tagData && tagData.key) {
                                            vElement.key = tagData.key;
                                        }
                                        if (parent === null) {
                                            if (hasRootNodeAlready === true) {
                                                throw new Error('t7 templates must contain only a single root element');
                                            }
                                            hasRootNodeAlready = true;
                                            if (root === null && vElement.closed === false) {
                                                root = parent = vElement;
                                            } else {
                                                root = vElement;
                                            }
                                        } else if (parent instanceof Array) {
                                            parent.push(vElement);
                                        } else {
                                            parent.children.push(vElement);
                                        }
                                        if (!selfClosingTags[tagName] && vElement.closed === false) {
                                            if (parent === vElement) {
                                                vElement.parent = null;
                                            } else {
                                                vElement.parent = parent;
                                            }
                                            parent = vElement;
                                        }
                                    }
                                    insideTag = false;
                                    tagContent = '';
                                    childText = '';
                                } else if (insideTag === true) {
                                    tagContent += char;
                                    lastChar = char;
                                } else {
                                    childText += char;
                                    lastChar = char;
                                }
                            }
                            return root;
                        }
                        function getTagData(tagText) {
                            var parts = [];
                            var char = '';
                            var lastChar = '';
                            var i = 0;
                            var s = 0;
                            var n = 0;
                            var n2 = 0;
                            var currentString = '';
                            var inQuotes = false;
                            var attrParts = [];
                            var key = '';
                            var assignments = [];
                            for (i = 0, n = tagText.length; i < n; i++) {
                                char = tagText[i];
                                if (char === ' ' && inQuotes === false) {
                                    parts.push(currentString);
                                    currentString = '';
                                } else if (char === '\'') {
                                    if (inQuotes === false) {
                                        inQuotes = true;
                                    } else {
                                        inQuotes = false;
                                        parts.push(currentString);
                                        currentString = '';
                                    }
                                } else if (char === '"') {
                                    if (inQuotes === false) {
                                        inQuotes = true;
                                    } else {
                                        inQuotes = false;
                                        parts.push(currentString);
                                        currentString = '';
                                    }
                                } else {
                                    currentString += char;
                                }
                            }
                            if (currentString !== '') {
                                parts.push(currentString);
                            }
                            currentString = '';
                            for (i = 1, n = parts.length; i < n; i++) {
                                attrParts = [];
                                lastChar = '';
                                currentString = '';
                                for (s = 0, n2 = parts[i].length; s < n2; s++) {
                                    char = parts[i][s];
                                    if (char === '=') {
                                        attrParts.push(currentString);
                                        currentString = '';
                                    } else {
                                        currentString += char;
                                        lastChar = char;
                                    }
                                }
                                if (currentString != '') {
                                    attrParts.push(currentString);
                                }
                                if (attrParts.length > 1) {
                                    var matches = attrParts[1].match(/__\$props__\[\d*\]/g);
                                    if (matches !== null) {
                                        if (attrParts[0] === '@@assign') {
                                            assignments.push(attrParts[1]);
                                        } else {
                                            assignments.push(attrParts);
                                        }
                                    } else {
                                        assignments.push(attrParts);
                                        if (attrParts[0] === 'key')
                                            key = attrParts[1];
                                    }
                                }
                            }
                            return {
                                tag: parts[0],
                                key: key,
                                assignments: assignments
                            };
                        }
                        ;
                        function addNewScriptFunction(scriptString, templateKey) {
                            scriptString = `
      Dropin['jsx-template-cache-${ templateKey }'] = function(t7, React) {
        ${ scriptString }
      };
    `;
                            var funcCode = scriptString + '\n//# sourceURL=' + templateKey;
                            var scriptElement = document.createElement('script');
                            scriptElement.textContent = funcCode;
                            docHead.appendChild(scriptElement);
                            Dropin[`jsx-template-cache-${ templateKey }`](t7, React);
                        }
                        function createTemplateKey(tpl) {
                            var hash = 0, i, chr, len;
                            if (tpl.length == 0)
                                return tpl;
                            for (i = 0, len = tpl.length; i < len; i++) {
                                chr = tpl.charCodeAt(i);
                                hash = (hash << 5) - hash + chr;
                                hash |= 0;
                            }
                            return hash;
                        }
                        ;
                        function t7(template) {
                            var fullHtml = null;
                            var i = 1;
                            var n = arguments.length;
                            var functionString = null;
                            var scriptString = null;
                            var scriptCode = '';
                            var templateKey = null;
                            var tpl = template[0];
                            var values = [].slice.call(arguments, 1);
                            for (; i < n; i++) {
                                tpl += template[i];
                            }
                            ;
                            templateKey = createTemplateKey(tpl);
                            if (t7._cache[templateKey] == null) {
                                fullHtml = '';
                                for (i = 0, n = template.length; i < n; i++) {
                                    if (i === template.length - 1) {
                                        fullHtml += template[i];
                                    } else if (template[i].slice(-4) === ' ...') {
                                        fullHtml += template[i].slice(0, template[i].length - 3) + '@@assign=__$props__[' + i + ']';
                                    } else {
                                        fullHtml += template[i] + '__$props__[' + i + ']';
                                    }
                                }
                                functionString = [];
                                buildFunction(getVdom(fullHtml, values), functionString, this, templateKey);
                                scriptCode = functionString.join(',');
                                if (precompile === true) {
                                    return {
                                        templateKey: templateKey,
                                        template: 'return ' + scriptCode
                                    };
                                } else {
                                    scriptString = 't7._cache["' + templateKey + '"]=function(__$props__, __$components__, t7)';
                                    scriptString += '{"use strict";return ' + scriptCode + '}';
                                    addNewScriptFunction(scriptString, templateKey);
                                }
                            }
                            return t7._cache[templateKey](values, this, t7);
                        }
                        ;
                        var ARRAY_PROPS = {
                            length: 'number',
                            sort: 'function',
                            slice: 'function',
                            splice: 'function'
                        };
                        t7._cache = {};
                        t7._templateCache = {};
                        t7.Outputs = {
                            React: 1,
                            Universal: 2,
                            Inferno: 3,
                            Mithril: 4
                        };
                        t7.getTemplateCache = function (id) {
                            return t7._templateCache[id];
                        };
                        t7.getOutput = function () {
                            return output;
                        };
                        t7.setPrecompile = function (val) {
                            precompile = val;
                        };
                        t7.getVersion = function () {
                            return version;
                        };
                        t7.if = function (expression, truthy) {
                            if (expression) {
                                return {
                                    else: function () {
                                        return truthy();
                                    }
                                };
                            } else {
                                return {
                                    else: function (falsey) {
                                        return falsey();
                                    }
                                };
                            }
                        }, t7.setOutput = function (newOutput) {
                            output = newOutput;
                        };
                        t7.clearCache = function () {
                            t7._cache = {};
                            t7._templateCache = {};
                        };
                        t7.assign = function (compName) {
                            throw new Error('Error assigning component \'' + compName + '\'. You can only assign components from within a module. Please check documentation for t7.module().');
                        };
                        t7.module = function (callback) {
                            var components = {};
                            var instance = function () {
                                return t7.apply(components, arguments);
                            };
                            instance.assign = function (name, val) {
                                if (arguments.length === 2) {
                                    components[name] = val;
                                } else {
                                    for (var key in name) {
                                        components[key] = name[key];
                                    }
                                }
                            };
                            instance.loadComponent = function (name) {
                                return components[name];
                            };
                            instance.if = t7.if;
                            instance.Outputs = t7.Outputs;
                            instance.clearCache = t7.clearCache;
                            instance.setOutput = t7.setOutput;
                            instance.getOutput = t7.getOutput;
                            instance.precompile = t7.precompile;
                            callback(instance);
                        };
                        t7.precompile = function () {
                        };
                        output = typeof React != 'undefined' ? t7.Outputs.React : typeof Inferno != 'undefined' ? t7.Outputs.Inferno : t7.Outputs.Universal;
                        return t7;
                    }();
                    t7.setOutput(t7.Outputs.React);
                    module.exports = DropinUtils.factory(() => {
                        let scope;
                        t7.module(t7 => scope = t7);
                        const ret = (...args) => scope(...args);
                        ret.use = components => {
                            Object.keys(components).forEach(name => scope.assign(name, components[name]));
                        };
                        return ret;
                    });
                },
                deps: { 'react': 2 }
            },
            2: {
                define: function (require, module, exports) {
                    module.exports = $DROPIN_EXTERN$['react'];
                },
                deps: {}
            }
        };
    return Dropin.createInternalRequire($DROPIN_MODS$, { 'entry': 1 })('entry');
});