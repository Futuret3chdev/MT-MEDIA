// Mobile-friendly version of the script

// Constants and initial setup
const q7 = '"Helvetica Neue", Helvetica, Arial, sans-serif';
let width = window.innerWidth;
let height = window.innerHeight;
const resolution = height / 480;
const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
document.body.appendChild(canvas);
canvas.width = width;
canvas.height = height;
const t2 = canvas.getContext("2d");

// Responsive resizing
window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

// Simplified color themes for performance
const u2 = {
    LIGHT: { road: "#3a3a3a", grass: "#047804", w0: "#ba0404", lane: "#CCCCCC" },
    DARK: { road: "#3a3a3a", grass: "#006A00", w0: "#BBBBBB" }
};

// Canvas context helper functions (unchanged)
function j7(t, i) { t2.clearRect(0, 0, t, i); }
function g1(t) { t2.globalAlpha = t; }
function m2(t, i, a, r) { t2.fillRect(t, i, a, r); }
function k4(t) { t2.fillStyle = t; }
function k3() { t2.beginPath(); }
function p0(t, i) { t2.moveTo(t, i); }
function o9(t, i) { t2.lineTo(t, i); }
function k0() { t2.closePath(); }
function s2() { t2.fill(); }
function l2(t, i, a) { t2.fillText(t, i, a); }
function s3() { t2.save(); }
function n0() { t2.restore(); }
function j4(t, i) { t2.translate(t, i); }
function q1(t) { t2.rotate(t); }

// Math helpers
const M = Math;
const PI = M.PI;
function r9() { return M.random(); }
function m8(t) { return M.floor(r9() * t); }
function sin(t) { return M.sin(t); }
function cos(t) { return M.cos(t); }

// Core game objects
let v0 = new u3(); // Camera
let v5 = null; // Road
let race = new Race();
let cars = [];
let u4 = null; // Player car
let cntx = t2;

// Camera class
function u3() {
    this.fieldOfView = 100;
    this.y = 0;
    this.z = 0;
    this.l5 = 100; // Reduced for mobile performance
    this.depth = 0;
    this.t6 = 700;
    this.reset = function() {
        this.depth = 1 / M.tan(this.fieldOfView / 2 * PI / 180);
    };
    this.t7 = function(t, i, a, r, e) {
        let s = this.z - (a ? v5.r1() : 0);
        t.v0.x = (t.v4.x || 0) - this.x - i;
        t.v0.y = (t.v4.y || 0) - this.y;
        t.v0.z = (t.v4.z || 0) - s;
        t.u1.scale = this.depth / t.v0.z;
        t.u1.x = M.round(r / 2 + t.u1.scale * t.v0.x * r / 2);
        t.u1.y = M.round(e / 2 - t.u1.scale * t.v0.y * e / 2);
    };
    this.update = function(t) {
        this.z = cars[0].z - this.t6;
        if (this.z < 0) this.z += v5.r1();
        this.x = cars[0].x + cars[0].width / 2;
        let i = v5.n1(cars[0].z);
        let a = b2(cars[0].z, v3.t4Length);
        this.y = 740 + g4(i.p1.v4.y, i.p3.v4.y, a);
    };
}

// Road class
function v3() {
    this.t4s = [];
    this.v5Length = 0;
    this.m9 = function(t, i = 0) {
        let r = this.lastY();
        for (let n = 0; n < t; n++) {
            let s = this.t4s.length * v3.t4Length;
            this.t4s.push({
                index: this.t4s.length,
                p1: { v4: { x: -1200, y: r, z: s }, v0: {}, u1: {} },
                p2: { v4: { x: 1200, y: r, z: s }, v0: {}, u1: {} },
                p3: { v4: { x: 1200, y: r + i, z: s + v3.t4Length }, v0: {}, u1: {} },
                p4: { v4: { x: -1200, y: r + i, z: s + v3.t4Length }, v0: {}, u1: {} },
                v6: 0,
                r3: 60,
                t8: [],
                cars: [],
                color: u2.LIGHT
            });
            r += i;
        }
        this.v5Length = this.t4s.length * v3.t4Length;
    };
    this.o8 = function(t) { return this.t4s[t]; };
    this.o8Count = function() { return this.t4s.length; };
    this.r1 = function() { return this.v5Length; };
    this.n1 = function(t) { return this.t4s[M.floor(t / v3.t4Length) % this.t4s.length]; };
}
v3.t4Length = 300;

// Car class
function Car() {
    this.sprite = 0;
    this.index = 0;
    this.width = 500;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.lap = 0;
    this.v9 = 0; // Speed
    this.accel = 6800;
    this.decel = -8000;
    this.s4 = 26000; // Max speed
    this.n4 = 0.3; // Turn speed
    this.q2 = false; // Accelerating
    this.v2 = false; // Braking
    this.s1 = false; // Left
    this.q6 = false; // Right
    this.update = function(t) {
        let a = v5.n1(this.z);
        this.percent = b2(this.z, v3.t4Length);
        let s = t * 3000 * (this.v9 / this.s4);
        if (this.index === 0) {
            if (this.s1) this.x -= s * this.n4;
            if (this.q6) this.x += s * this.n4;
            if (this.q2) this.v9 = M.min(this.v9 + this.accel * t, this.s4);
            else if (this.v2) this.v9 = M.max(this.v9 + this.decel * t, 0);
            else this.v9 = M.max(this.v9 + this.decel * t * 0.5, 0);
            this.z = (this.z + t * this.v9) % v5.r1();
            this.y = g4(a.p1.v4.y, a.p3.v4.y, this.percent);
        }
    };
}

// Race class
function Race() {
    this.state = 0;
    this.init = function() {
        v5 = new v3();
        v5.m9(100); // Simple flat road for mobile
        cars = [new Car()];
        cars[0].z = v3.t4Length;
        u4 = cars[0];
    };
    this.update = function(t) {
        if (this.state === 1) {
            cars.forEach(car => car.update(t));
            v0.update(t);
        }
    };
    this.render = function() {
        k4("#4576aa"); // Sky
        m2(0, 0, width, height);
        let t = v5.n1(v0.z);
        let s = height;
        for (let v = 0; v < v0.l5; v++) {
            let c = v5.o8((t.index + v) % v5.o8Count());
            c.u9 = c.index < t.index;
            c.clip = s;
            v0.t7(c.p1, 0, c.u9, width, height);
            v0.t7(c.p2, 0, c.u9, width, height);
            v0.t7(c.p3, 0, c.u9, width, height);
            v0.t7(c.p4, 0, c.u9, width, height);
            if (c.p1.v0.z <= v0.depth || c.p3.u1.y >= c.p1.u1.y || c.p3.u1.y >= s) continue;
            k4(c.color.grass);
            m2(0, c.p3.u1.y, width, c.p1.u1.y - c.p3.u1.y);
            k4(c.color.road);
            t2.beginPath();
            p0(c.p1.u1.x, c.p1.u1.y);
            o9(c.p2.u1.x, c.p2.u1.y);
            o9(c.p3.u1.x, c.p3.u1.y);
            o9(c.p4.u1.x, c.p4.u1.y);
            k0();
            s2();
            s = c.p1.u1.y;
        }
        k4("#FF0000"); // Player car
        let p = g4(t.p1.u1.y, t.p4.u1.y, u4.percent);
        let x = width / 2 + u4.x * t.p1.u1.scale * width / 2;
        m2(x - 20, p - 20, 40, 40);
    };
}

// Touch controls
const controls = {
    up: false,
    down: false,
    left: false,
    right: false
};

canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    if (x < width / 3) controls.left = true;
    else if (x > 2 * width / 3) controls.right = true;
    if (y < height / 2) controls.up = true;
    else controls.down = true;
    updateControls();
}, { passive: false });

canvas.addEventListener("touchend", e => {
    e.preventDefault();
    controls.up = controls.down = controls.left = controls.right = false;
    updateControls();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    controls.left = x < width / 3;
    controls.right = x > 2 * width / 3;
    controls.up = y < height / 2;
    controls.down = y > height / 2;
    updateControls();
}, { passive: false });

function updateControls() {
    u4.q2 = controls.up;
    u4.v2 = controls.down;
    u4.s1 = controls.left;
    u4.q6 = controls.right;
}

// Utility functions
function b2(t, i) { return t % i / i; }
function g4(t, i, a) { return t + (i - t) * a; }

// Game loop
let last = performance.now();
function frame() {
    const now = performance.now();
    const dt = M.min(1, (now - last) / 1000);
    last = now;
    
    if (race.state === 0) {
        race.state = 1; // Auto-start
        race.init();
    }
    
    race.update(dt);
    race.render();
    requestAnimationFrame(frame);
}

v0.reset();
frame();