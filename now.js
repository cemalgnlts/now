export default class Now {
	#events = new EventTarget();
	#resolveBootPromise = null;
	#worker = new Worker("./worker.js", {
		type: "module"
	});

	constructor() {
		this.#worker.onmessage = (ev) => this.onMessage(ev.data);
		this.#worker.onerror = (ev) => console.error(ev);
		
		this.stdin = {
			write: msg => this.#worker.postMessage({ cmd: "stdin", msg })
		};
	}

	on(type, listener) {
		this.#worker.postMessage({
			cmd: `listen-${type}`
		});
		
		this.#events.addEventListener(type, ev => listener(ev.detail));
	}

	onMessage({ cmd, msg, type }) {
		switch(cmd) {
			case "ready":
				this.#worker.postMessage("boot");
				this.#resolveBootPromise();
				break;
			case "event":
				this.#events.dispatchEvent(new CustomEvent(type, {
					detail: msg
				}));
				break;
		}
	}

	async boot() {
		this.#worker.postMessage({ cmd: "boot" });
		
		return new Promise(resolve => {
			this.#resolveBootPromise = resolve;
		});
	}
}
