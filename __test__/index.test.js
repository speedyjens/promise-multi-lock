const lock = require("../lib/index");
const util = require("util");
const wait = (time) => {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	})
}

expect.extend({
	toBeWithinRange(received, floor, ceiling) {
		const pass = received >= floor && received <= ceiling;
		if (pass) {
			return {
				message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
				pass: false,
			};
		}
	}
});

test("Locks a resource and access it out of order", async () => {
	let combined = "";

	let multi_lock = new lock.MultiLock();

	multi_lock.lock("banan");
	await Promise.all([
		async () => {
			await wait(1000);
			combined += "He";
			multi_lock.unlock("banan#1");
		},
		async () => {
			await multi_lock.lock("banan#2.");
			await wait(500);
			combined += "llo";
			multi_lock.unlock("banan#2,");
		},
		async () => {
			await multi_lock.lock("banan#3.");
			await wait(250);
			combined += " Wo";
			multi_lock.unlock("banan#3,");
		},
		async () => {
			await multi_lock.lock("banan#4.");
			await wait(100);
			combined += "rld";
			multi_lock.unlock("banan#4,");
		},
		async () => {
			await multi_lock.lock("banan#5.");
			await wait(50);
			combined += "!";
			multi_lock.unlock("banan#5,");
		}
	].map(v => v()));
	expect(combined).toBe("Hello World!");
})

test("Throws error and propegates the error correctly", async () => {
	let first_error = null;
	let second_error = null;
	const multi_lock = new lock.MultiLock();
	try {
		await Promise.all([
			async () => {
				await multi_lock.lock("spaghetti");
				await wait(1000);
				try {
					multi_lock.unlock("spaghetti");
				} catch (e) {
					first_error = e;
				}
			},
			async () => {
				await multi_lock.lock("spaghetti");
				throw new Error("Should not be received");
			}
		].map(v => v()))
	} catch (e) {
		second_error = e;
	}

	expect(first_error).toBe(null);
	expect(second_error).toBeInstanceOf(Error);
})

test("Lock should be freed in 1 second", async () => {
	const multi_lock = new lock.MultiLock();
	await multi_lock.lock("skdo");
	let first = new Date().getTime();
	setTimeout(() => {
		multi_lock.unlock("skdo");
	}, 1000);
	await multi_lock.lock("skdo");
	expect(new Date().getTime() - first).toBeWithinRange(980, 1050);
});

test("Lock should be destroyed and queue shouldnt be executed afterwards, lock should be unlocked", done => {
	const multi_lock = new lock.MultiLock();
	let has_run = false;
	setTimeout(() => {
		multi_lock.destroy("banan");
		setTimeout(() =>  {
			expect(has_run).toBe(false);
			expect(multi_lock.is_locked("banan")).toBe(false);
			done();
		}, 1000)
	}, 1000);
	multi_lock.lock("banan").then(() => {
		return multi_lock.lock("banan");
	}).then(() => {
		has_run = true;
	})
});