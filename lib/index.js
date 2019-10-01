"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MultiLock {
    constructor() {
        this.locks = {};
    }
    async lock(res) {
        const resource = res.split("#")[0];
        if (this.locks[resource] == undefined) {
            this.locks[resource] = { queue: [], locked: true };
            return;
        }
        if (this.locks[resource].locked) {
            await new Promise((resolve, reject) => {
                this.locks[resource].queue.push(resolve);
            });
        }
        else {
            this.locks[resource].locked = true;
        }
    }
    unlock(res) {
        const resource = res.split("#")[0];
        if (this.locks[resource] == undefined) {
            return;
        }
        if (this.locks[resource].queue.length == 0) {
            delete this.locks[resource];
            return;
        }
        if (this.locks[resource].locked) {
            this.locks[resource].queue.splice(0, 1)[0]();
        }
        return;
    }
}
exports.MultiLock = MultiLock;
