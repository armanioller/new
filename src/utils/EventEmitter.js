export class EventEmitter {
    constructor() {
        this._events = {};
    }
    on(name, callback) {
        if (!this._events[name]) this._events[name] = [];
        this._events[name].push(callback);
    }
    emit(name, ...args) {
        if (!this._events[name]) return;
        this._events[name].forEach(cb => cb(...args));
    }
}
