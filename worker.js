import {
	events,
	Module,
	installWASM,
	run,
	ccall,
	cwrap
} from "./tinyemu/x86emu-wasm.js";

self.onmessage = async function onMessage({ data }) {
	const { cmd, msg } = data;

	switch(cmd) {
		case "boot":
			boot();
			break;
		case "stdin":
			stdin(msg);
			break;
		case "listen-stdout":
		case "listen-data":
			registerEvent(cmd.split("-")[1]);
			break;
	}
}

let resolveNodeReadyPromise = null;
let isShellReady = false;
let isNodeReady = false;
let consoleWrite = null;
let netSetCarrier, netWritePacket;

const VMParams = {
	cfg: `${location.origin}/now/tinyemu/alpine-x86.cfg`,
	memSize: 192,
	cmdline: "",
	width: 0, // No GUI
	height: 0, // No GUI
	netUrl: "wss://relay.widgetry.org/",
	driveUrl: "",
};

Module.preRun = preRun;
Module.termSize = [80, 30];

events.addEventListener("updateDownloading", updateDloading);
events.addEventListener("stdout", terminalMessage);

function boot() {
	if(isShellReady) {
		postMessage({
			cmd: "warn",
			msg: "Shell is already initialized."
		});
		
		return;
	}

	installWASM();
}

function registerEvent(type) {
	events.addEventListener(type, ev => {
		if(!isNodeReady) return;
		
		postMessage({
			type,
			cmd: "event",
			msg: ev.detail
		});
	});
}

function updateDloading(ev) {
	const isDloading = ev.detail;
	self.postMessage(isDloading ? "---> Downloading" : "Downloaded <---");
}

function terminalMessage(ev) {
	const msg = ev.detail;

	if(isShellReady === false && msg.startsWith("localhost:")) {
		shellReady();
	} else if(isShellReady && isNodeReady === false && msg.startsWith("localhost:")) {
		nodeReady();
		
		postMessage({
			type: "stdout",
			cmd: "event",
			msg: ev.detail
		});
		
		postMessage({
			type: "data",
			cmd: "event",
			msg: ev.detail
		});
	}
}

function shellReady() {
	isShellReady = true;

	const cmd = "node --version\n";
	stdin(cmd);
}

function nodeReady() {
	isNodeReady = true;

	events.removeEventListener("updateDownloading", updateDloading);
	events.removeEventListener("stdout", terminalMessage);

	postMessage({ cmd: "ready" });
}

function stdin(cmd) {
	for(const chr of cmd) consoleWrite(chr.charCodeAt());
}

function preRun() {
	consoleWrite = Module.cwrap("console_queue_char", null, ["number"]);
	netWritePacket = Module.cwrap("net_write_packet", null, ["number", "number"]);
	netSetCarrier = Module.cwrap("net_set_carrier", null, ["number"]);

	if (VMParams.netUrl !== "") {
		Module.net_state = new Ethernet(VMParams.netUrl);
	}

	ccall("vm_start", null, [
		"string",
		"number",
		"string",
		"string",
		"number",
		"number",
		"number",
		"string"
	], [
		VMParams.cfg,
		VMParams.memSize,
		VMParams.cmdline,
		null,
		VMParams.width,
		VMParams.height,
		(Module.net_state != null) | 0,
		VMParams.driveUrl
	]);
}

/* Network support */

function Ethernet(url) {
    try {
        this.socket = new WebSocket(url);
    } catch (err) {
        this.socket = null;
        console.log("Could not open websocket url=" + url);
        return;
    }
	
    this.socket.binaryType = "arraybuffer";
    this.socket.onmessage = this.messageHandler.bind(this);
    this.socket.onclose = this.closeHandler.bind(this);
    this.socket.onopen = this.openHandler.bind(this);
    this.socket.onerror = this.errorHandler.bind(this);
}

Ethernet.prototype.openHandler = function (e) {
    netSetCarrier(1);
};

Ethernet.prototype.closeHandler = function (e) {
    netSetCarrier(0);
};

Ethernet.prototype.errorHandler = function (e) {
    console.log("Websocket error=" + e);
};

Ethernet.prototype.messageHandler = function (e) {
    var str, buf_len, buf_addr, buf;
    if (e.data instanceof ArrayBuffer) {
        buf_len = e.data.byteLength;
        buf = new Uint8Array(e.data);
        buf_addr = Module._malloc(buf_len);
        Module.HEAPU8.set(buf, buf_addr);
        netWritePacket(buf_addr, buf_len);
        Module._free(buf_addr);
    } else {
        str = e.data.toString();
        if (str.substring(0, 5) == "ping:") {
            try {
                this.socket.send("pong:" + str.substring(5));
            } catch (err) {}
        }
    }
};

Ethernet.prototype.recv_packet = function (buf) {
    if (this.socket) {
        try {
            this.socket.send(buf);
        } catch (err) {}
    }
};
