interface LockData {
	queue: Array<() => void>;
	locked: boolean;
}

export class MultiLock {
	locks: {[index: string]: LockData}
	
	constructor() {
		this.locks = {};
	}

	async lock(res: string): Promise<void> {
		const resource = res.split("#")[0];
		if (this.locks[resource] == undefined) {
			this.locks[resource] = {queue: [], locked: true};
			return;
		}
		if(this.locks[resource].locked) {
			await new Promise((resolve, reject) => {
				this.locks[resource].queue.push(resolve);
			})
		} else {
			this.locks[resource].locked = true;
		}
	}

	unlock(res: string) {
		const resource = res.split("#")[0];
		if (this.locks[resource] == undefined) {
			return;
		} 
		if (this.locks[resource].queue.length == 0) {
			delete this.locks[resource]
			return;
		}
		if (this.locks[resource].locked) {
			this.locks[resource].queue.splice(0, 1)[0]();
		}
		return;
	}
}