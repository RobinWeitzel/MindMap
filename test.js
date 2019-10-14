class Element {
    constructor(svg, x, y) {
        this.obj = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");

        this.obj.onmouseenter = () => this.hover = true;
        this.obj.onmouseleave = () => this.hover = false;

        this.div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");

        this.div.oninput = e => {
            this.adjustSize();
        }

        this.obj.appendChild(this.div);
        svg.appendChild(this.obj);

        this.x = x;
        this.y = y;
        this.text = "";
        this.editable = false;
        this.children = new Proxy([], {
            set: (target, property, value, receiver) => {
                target[property] = value;
                if(property !== "length") {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

                    line.setAttribute("x1", this.x + this.obj.getBoundingClientRect().width/2);
                    line.setAttribute("y1", this.y + this.obj.getBoundingClientRect().height/2);
                    line.setAttribute("x2", value.x + value.obj.getBoundingClientRect().width/2);
                    line.setAttribute("y2", value.y + value.obj.getBoundingClientRect().height/2);
                    line.setAttribute('stroke', 'gray');
                    line.setAttribute('stroke-width', 2);

                    svg.appendChild(line);

                    this.xChange = x => line.setAttribute("x1", x + this.obj.getBoundingClientRect().width/2);
                    this.yChange = y => line.setAttribute("y1", y + this.obj.getBoundingClientRect().height/2);

                    value.xChange = x => line.setAttribute("x2", x + value.obj.getBoundingClientRect().width/2);
                    value.yChange = y => line.setAttribute("y2", y + value.obj.getBoundingClientRect().height/2);
                }
                return true;
            }
        });
    }

    get x() {
        return this._x;
    }

    set x(val) {
        this._x = val;
        this.obj.setAttribute("x", val);
        this.xChange(val);
    }

    get xChange() {
        return this._xChange || (x => {});
    }

    set xChange(val) {
        if(this._xChange === undefined) {
            this._xChange = val;
        } else {
            const oldEvent = this._xChange;
            this._xChange = x => {
                oldEvent(x);
                val(x);
            }
        }
    }

    get yChange() {
        return this._yChange || (y => {});
    }

    set yChange(val) {
        if(this._yChange === undefined) {
            this._yChange = val;
        } else {
            const oldEvent = this._yChange;
            this._yChange = y => {
                oldEvent(y);
                val(y);
            }
        }
    }

    get y() {
        return this._y;
    }

    set y(val) {
        this._y = val;
        this.obj.setAttribute("y", val);
        this.yChange(val);
    }

    set text(val) {
        this.div.textContent = val;
        this.adjustSize();
    }

    get editable() {
        return this._editable;
    }

    set editable(val) {
        this._editable = val;
        this.div.setAttribute("contentEditable", val);
        if(val) {
            this.div.focus();
        }
    }

    adjustSize() {
        const oldWidth = this.obj.getBoundingClientRect().width;
        const oldHeight = this.obj.getBoundingClientRect().height;
        const newWidth = this.div.getBoundingClientRect().width + 30; // width + padding
        const newHeight = this.div.getBoundingClientRect().height + 30; // width + padding
        this.obj.setAttribute("width", newWidth + "px");
        this.obj.setAttribute("height", newHeight + "px");
        this.x -= (newWidth - oldWidth) / 2;
        this.y -= (newHeight - oldHeight) / 2;
    }
}

const svg = document.querySelector("body > svg");
const elements = [];

for (let element of elements) {
    const e = new Element(svg, element.x, element.y);
}

const e1 = new Element(svg, 100, 100);
elements.push(e1);
const e2 = new Element(svg, 300, 100);
elements.push(e2);
const e3 = new Element(svg, 300, 300);
elements.push(e3);
e1.children.push(e2);
e1.children.push(e3);

svg.onmousedown = e => {
    let element = null;
    for(const elem of elements) {
        if(elem.hover)
            element = elem;
        else
        elem.editable = false;
    }

    if(element === null)
        return;

    if (!element.editable) {
        if (e.button === 0) { // Left mouse
            const startX = element.x;
            const startY = element.y;
            element.editable = false;
            let moved = false;

            svg.onmousemove = ee => {
                moved = true;
                element.x = startX - (e.clientX - ee.clientX);
                element.y = startY - (e.clientY - ee.clientY);
            }

            element.obj.onmouseup = ee => {
                svg.onmousemove = undefined;

                element.editable = !moved;
            }
        } else if (button === 2) { // right mouse

        }
    }
}

svg.ondblclick = e => {
    if(e.target.matches("body > svg")) {
        const elem = new Element(svg, e.clientX, e.clientY);
        elements.push(elem);
        elem.editable = true;
    }
}