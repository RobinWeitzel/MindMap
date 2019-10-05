const body = document.body;
const svg = document.querySelector('svg');
const lib = JsonUrl('lzma'); // JsonUrl is added to the window object
let storageType = "";
let id;

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const removeElement = (array, element) => {
    const index = array.indexOf(element);

    if (index < 0)
        return;

    array.splice(index, 1);
}

const createBubble = (x, y) => {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.style.left = x;
    bubble.style.top = y;
    bubble.style.position = 'absolute';
    bubble.style.fontSize = "16px";
    bubble.style.backgroundColor = 'lightgray';
    bubble.style.borderColor = 'gray';
    bubble.setAttribute('contenteditable', true);

    bubble.id = uuidv4();
    bubble.lines = {
        start: [],
        end: []
    }

    bubble.onmouseover = () => {
        bubble.setAttribute("mouseover", true);
    };

    bubble.onmouseout = () => {
        bubble.setAttribute("mouseover", false);
    };

    bubble.oninput = () => {
        save();
    }

    return bubble;
}

const createLine = (x, y) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute('stroke', 'gray');
    line.setAttribute('stroke-width', 2);

    line.id = uuidv4();

    line.onmouseover = () => {
        if (line.getAttribute('stroke') === "gray")
            line.setAttribute('stroke', 'lightblue');
    };

    line.onmouseout = () => {
        if (line.getAttribute('stroke') === "lightblue")
            line.setAttribute('stroke', 'gray');
    };

    return line;
}

const clearSelection = () => {
    if (document.selection && document.selection.empty) {
        document.selection.empty();
    } else if (window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
}

body.addEventListener('click', e => {
    const dialog = e.target.closest('.dialog');
    if (dialog) 
        return;

    const bubbles = document.querySelectorAll('.bubble[contenteditable="true"]');
    for (const bubble of bubbles) {
        if (e.target !== bubble)
            bubble.setAttribute('contenteditable', false);
    }

    const lines = document.querySelectorAll('line[stroke="blue"]');
    for (const line of lines) {
        line.setAttribute('stroke', 'black');
    }
});

let selection = undefined;

['mouseup', 'touchend', 'touchcancel'].forEach(evt => {
    body.addEventListener(evt, e => {
        if (selection === undefined)
            return;

        if (selection.type === "line") {
            const end = document.querySelector('.bubble[mouseover="true"]');

            if (end === null || end === selection.start) {
                svg.removeChild(selection.line);
            } else {
                selection.start.lines.start.push(selection.line);
                end.lines.end.push(selection.line);
                selection.line.start = selection.start;
                selection.line.end = end;
            }
        }

        save();

        selection = undefined;
    });
});

['mousedown', 'touchstart'].forEach(evt => {
    body.addEventListener(evt, e => {
        const dialog = e.target.closest('.dialog');
        if (dialog)
            return;
        const nodeName = e.target.nodeName.toLowerCase();
        if (nodeName === "div" && e.target.getAttribute('contenteditable') === "false") {
            if (e.button === 0) { // left mouse
                selection = {
                    bubble: e.target,
                    x: e.target.getBoundingClientRect().x - e.clientX,
                    y: e.target.getBoundingClientRect().y - e.clientY,
                    type: "drag"
                };
            } else if (e.button === 2) { // right mouse
                const line = createLine(e.clientX, e.clientY);
                svg.appendChild(line);
                selection = {
                    line: line,
                    start: e.target,
                    type: "line"
                };
            }
        } else {
            if (e.button === 0) { // left mouse
                selection = {
                    x: e.clientX,
                    y: e.clientY,
                    type: "move"
                };
            }
        }
    });
});

['mousemove', 'touchmove'].forEach(evt => {
    body.addEventListener(evt, e => {
        if (selection === undefined)
            return;

        const dialog = e.target.closest('.dialog');
        if (dialog)
            return;

        if (selection.type === "drag") {
            const x = e.clientX + selection.x + "px";
            const y = e.clientY + selection.y + "px";

            selection.bubble.style.left = x;
            selection.bubble.style.top = y;

            for (const line of selection.bubble.lines.start) {
                line.setAttribute("x1", e.clientX);
                line.setAttribute("y1", e.clientY);
            }

            for (const line of selection.bubble.lines.end) {
                line.setAttribute("x2", e.clientX);
                line.setAttribute("y2", e.clientY);
            }
        } else if (selection.type === "line") {
            selection.line.setAttribute("x2", e.clientX);
            selection.line.setAttribute("y2", e.clientY);
        } else if (selection.type === "move") {
            const bubbles = document.querySelectorAll('.bubble');
            const lines = document.querySelectorAll('line');

            const x = e.clientX;
            const y = e.clientY;

            for (const bubble of bubbles) {
                bubble.style.left = bubble.getBoundingClientRect().x + (x - selection.x) + "px";
                bubble.style.top = bubble.getBoundingClientRect().y + (y - selection.y) + "px";
            }

            for (const line of lines) {
                const x1 = parseFloat(line.getAttribute("x1")) + (x - selection.x);
                const x2 = parseFloat(line.getAttribute("x2")) + (x - selection.x);
                const y1 = parseFloat(line.getAttribute("y1")) + (y - selection.y);
                const y2 = parseFloat(line.getAttribute("y2")) + (y - selection.y);

                line.setAttribute("x1", x1);
                line.setAttribute("x2", x2);
                line.setAttribute("y1", y1);
                line.setAttribute("y2", y2);
            }

            selection.x = x;
            selection.y = y;
        }
    });
});

body.addEventListener('dblclick', e => {
    e.preventDefault();
    clearSelection();
    const nodeName = e.target.nodeName.toLowerCase();
    if (nodeName === "svg") {
        const x = (e.clientX - 37.5) + "px";
        const y = (e.clientY - 25) + "px";
        const bubble = createBubble(x, y);
        body.appendChild(bubble);
        bubble.focus();
    } else if (nodeName === "div") {
        e.target.setAttribute('contenteditable', true);
        e.target.focus();
    } else if (nodeName === "line") {
        e.target.setAttribute('stroke', 'blue');
    }
});

const createNewMap = () => {
    id = uuidv4();
    load([], []);
    save();
    localStorage.setItem('current', id);
}

const setColor = (bubble, background, border) => {
    if (!bubble)
        return;

    bubble.style.backgroundColor = background;
    bubble.style.borderColor = border;
}

document.addEventListener("keyup", e => {
    const bubble = document.querySelector('.bubble[contenteditable="true"]');

    if (e.keyCode == 46) {
        const line = document.querySelector('line[stroke="blue"]');
        if (line !== null) {
            removeElement(line.start.lines.start, line);
            removeElement(line.end.lines.end, line);
            svg.removeChild(line);
        }

        if (bubble !== null) {
            for (const line of bubble.lines.start) {
                removeElement(line.end.lines.end, line);
                svg.removeChild(line);
            }

            for (const line of bubble.lines.end) {
                removeElement(line.start.lines.start, line);
                svg.removeChild(line);
            }

            body.removeChild(bubble);
        }
        save();
    }

    if (!e.altKey)
        return;

    switch (String.fromCharCode(e.keyCode)) {
        case "N": // New
            createNewMap();
            break;
        case "O": // Open
            const oldDialog = document.querySelector('.dialog');
            if (oldDialog)
                body.removeChild(oldDialog);

            const dialog = document.createElement('div');
            dialog.classList.add('dialog');
            body.appendChild(dialog);

            let row = 0;
            let column = 0;

            for (const key of Object.keys(localStorage)) {
                if (key === "current")
                    continue;

                const container = document.createElement('div');
                container.style.top = -33 + row * 33 + "vh";
                container.style.left = column * 33 + "vw";

                column++;
                if (column === 3) {
                    column = 0;
                    row++;
                }

                container.classList.add('container');
                container.appendChild(document.createElementNS("http://www.w3.org/2000/svg", 'svg'));
                dialog.appendChild(container);

                lib.decompress(localStorage[key]).then(result => {
                    load(result.bubbles || [], result.lines || [], container);

                    container.onclick = e => {
                            load(result.bubbles || [], result.lines || []);
                            localStorage.setItem('current', result.id);
                            id = result.id;
                            window.location.replace('#' + localStorage[key]);
                            body.removeChild(dialog);
                    };
                    container.oncontextmenu = e => {
                        if(confirm("Really delete this mind map?")) {
                            localStorage.removeItem(result.id);
                            if(id === result.id) {
                                localStorage.removeItem('current');
                            }
            
                            dialog.removeChild(container);
                        }
                    }
                });
            }
            break;
        case "G":
            setColor(bubble, 'lightgreen', 'green');
            save();
            break;
        case "R":
            setColor(bubble, 'red', 'darkred');
            save();
            break;
        case "B":
            setColor(bubble, 'lightblue', 'blue');
            save();
            break;
        case "O":
            setColor(bubble, 'orange', 'darkorange');
            save();
            break;
        case "Y":
            setColor(bubble, 'lightyellow', 'yellow');
            save();
            break;
        default:
            if ((e.keyCode === 187 || e.keyCode === 189) && bubble) { // Change size
                let fontSize = parseInt(bubble.style.fontSize.replace("px"));
        
                if (e.keyCode === 187)
                    fontSize += 2;
                else
                    fontSize -= 2;
        
                bubble.style.fontSize = fontSize + "px";
                save();
            } else {
                setColor(bubble, 'lightgray', 'gray');
                save();
            }
    }


    /*if (e.keyCode === 83) { // Save
        lib.compress(save(true)).then(output => {
            const url = 'https://mindmap.robinweitzel.de';
            const win = window.open(url + '#' + output, '_blank');
            win.focus();
        });
    }

    if (e.keyCode === 76 && e.altKey) { // Load
        storageType = "url_";
        const bubbles = JSON.parse(localStorage.getItem(storageType + 'bubbles'));
        const lines = JSON.parse(localStorage.getItem(storageType + 'lines'));
        load(bubbles, lines);
    }

    if (bubble === null)
        return;

    if ((e.keyCode === 187 || e.keyCode === 189) && e.altKey) { // Change size
        let fontSize = parseInt(bubble.style.fontSize.replace("px"));

        if (e.keyCode === 187)
            fontSize += 2;
        else
            fontSize -= 2;

        bubble.style.fontSize = fontSize + "px";
        save();
    }

    if (e.altKey) {
        let background;
        let border;
        switch (String.fromCharCode(e.keyCode)) { // Change color
            case "U":
                background = 'lightgray';
                border = 'gray';
                break;
            case "G":
                background = 'lightgreen';
                border = 'green';
                break;
            case "R":
                background = 'red';
                border = 'darkred';
                break;
            case "B":
                background = 'lightblue';
                border = 'blue';
                break;
            case "O":
                background = 'orange';
                border = 'darkorange';
                break;
            case "Y":
                background = 'lightyellow';
                border = 'yellow';
                break;
            default:
                return;
        }

        bubble.style.backgroundColor = background;
        bubble.style.borderColor = border;
        save();
    }*/
});

const save = () => {
    const bubbles = document.querySelectorAll('body > .bubble');
    const bubbleResults = [];
    for (const bubble of bubbles) {
        const result = {
            id: bubble.id,
            x: bubble.style.left,
            y: bubble.style.top,
            size: bubble.style.fontSize,
            text: bubble.innerText,
            color: bubble.style.backgroundColor,
            border: bubble.style.borderColor
        }

        bubbleResults.push(result);
    }

    const lines = document.querySelectorAll('#body-svg > line');
    const lineResults = [];
    for (const line of lines) {
        const result = {
            id: line.id,
            x1: line.getAttribute("x1"),
            x2: line.getAttribute("x2"),
            y1: line.getAttribute("y1"),
            y2: line.getAttribute("y2"),
            start: line.start.id,
            end: line.end.id
        }

        lineResults.push(result);
    }

    lib.compress({
        id: id,
        bubbles: bubbleResults,
        lines: lineResults
    }).then(hash => {
        localStorage.setItem(id, hash);
        window.location.replace("#" + hash);
    });

}

const load = (bubbles, lines, target) => {
    try {
        target = target || body;
        const svg = target.querySelector('svg');
        const oldBubbles = target.querySelectorAll('body > .bubble');
        for (const bubble of oldBubbles) {
            target.removeChild(bubble);
        }

        const oldLines = svg.querySelectorAll('line');
        for (const line of oldLines) {
            svg.removeChild(line);
        }

        const bubbleDict = {};

        for (const bubble of bubbles) {
            const b = createBubble(bubble.x, bubble.y);
            b.innerText = bubble.text;
            b.style.fontSize = bubble.size;
            b.style.backgroundColor = bubble.color || "lightgray";
            b.style.borderColor = bubble.border || "gray";
            b.id = bubble.id;

            bubbleDict[b.id] = b;

            target.appendChild(b);
        }

        for (const line of lines) {
            const l = createLine(line.x1, line.y1);
            l.setAttribute("x2", line.x2);
            l.setAttribute("y2", line.y2);
            l.id = line.id;
            l.start = bubbleDict[line.start];
            l.end = bubbleDict[line.end];

            bubbleDict[line.start].lines.start.push(l);
            bubbleDict[line.end].lines.end.push(l);

            svg.appendChild(l);
        }
    } catch (e) {

    }
}

const arr = window.location.href.split('#');

if (arr.length < 2) {
    id = localStorage.getItem('current');

    if (!id) {
        createNewMap();
    } else {
        lib.decompress(localStorage[id]).then(json => {
            load(json.bubbles, json.lines);
        });

        window.location.replace('#' + localStorage[id]);
    }
} else {
    lib.decompress(arr[1]).then(json => {
        id = json.id || uuidv4();
        load(json.bubbles, json.lines);
    });
}
