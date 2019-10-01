const lock = require("../lib/index");
const util = require("util");
const wait = (time) => {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	})
}

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