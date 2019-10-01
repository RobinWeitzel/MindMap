const body = document.body;
const svg = document.querySelector('svg');

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

body.addEventListener('mouseup', e => {
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

body.addEventListener('mousedown', e => {
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
    }
});

body.addEventListener('mousemove', e => {
    if (selection === undefined)
        return;

    const x = e.clientX + selection.x + "px";
    const y = e.clientY + selection.y + "px";

    if (selection.type === "drag") {
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
    }
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

    if (bubble === null)
        return;

    if ((e.keyCode === 187 || e.keyCode === 189) && e.altKey) {
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
        switch (String.fromCharCode(e.keyCode)) {
            case "N":
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
    }
});

const save = () => {
    const bubbles = document.querySelectorAll('.bubble');
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

    const lines = document.querySelectorAll('line');
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

    localStorage.setItem("bubbles", JSON.stringify(bubbleResults));
    localStorage.setItem("lines", JSON.stringify(lineResults));
}

const load = () => {
    try {
        const bubbles = JSON.parse(localStorage.getItem('bubbles'));
        const lines = JSON.parse(localStorage.getItem('lines'));

        const bubbleDict = {};

        for (const bubble of bubbles) {
            const b = createBubble(bubble.x, bubble.y);
            b.innerText = bubble.text;
            b.style.fontSize = bubble.size;
            b.style.backgroundColor = bubble.background || "lightgray";
            b.style.borderColor = bubble.border || "gray";
            b.id = bubble.id;

            bubbleDict[b.id] = b;

            body.appendChild(b);
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

load();