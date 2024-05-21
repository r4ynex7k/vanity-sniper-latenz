const tls = require("tls");
const WebSocket = require("ws");
const extract = require("extract-json-from-string");
const latenz = require("latenz");

const guilds = {};
const ws_links = [
    "wss://gateway.discord.gg"
  ];
let vanity = {
  vanity: "",
  event: null,
};

const start = (ws_server) => {
  const tlsSocket = tls.connect({
    host: "canary.discord.com",
    port: 443,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    handshakeTimeout: 1,
  });

  tlsSocket.on("data", async (data) => {
    const ext = extract(data.toString());
    if (!Array.isArray(ext)) {
    }
    const find = ext && (ext.find((e) => e.code) || ext.find((e) => e.message && e.message.toLowerCase().includes("rate")));
    if (find) {
    }
  });
  tlsSocket.on("secureConnect", () => {
    const socket = new WebSocket(ws_links);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        op: 2,
        d: {
          token: "self token",
          intents: 1,
          properties: {
            os: "linux",
            browser: "",
            device: "",
          },
        },
      }));
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      switch (message.t) {
        case "GUILD_UPDATE":
          const find_update = guilds[message.d.guild_id];
          if (find_update && find_update !== message.d.vanity_url) {
            requestt(tlsSocket, find_update);
          }
          break;
        case "GUILD_DELETE":
          const find_delete = guilds[message.d.guild_id];
          if (find_delete) {
            requestt(tlsSocket, find_delete);
          }
          break;
        case "READY":
            message.d.guilds
            .filter((e) => e.vanity_url_code)
            .forEach((guild) => (guilds[guild.id] = guild.vanity_url_code));
          const o = message.d.guilds
            .filter((e) => e.vanity_url_code)
            .map((guild) => guild.vanity_url_code)
            .join(", ");
            console.log(o);   
   }

      if (message.op === 10) {
        const heartbeatInterval = message.d.heartbeat_interval;
        setTimeout(() => {
          socket.send(JSON.stringify({ op: 1, d: {} }));
        }, heartbeatInterval);
      } else if (message.op === 7) {
        process.exit();
      }
    };

    setInterval(async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        tlsSocket.write("GET / HTTP/1.1\r\nHost: canary.discord.com\r\n\r\n");
      }
    }, 600);
  });
};

const requestt = (tlsSocket, code) => {
  const request_body = JSON.stringify({ code });
  tlsSocket.write(
    `PATCH /api/v7/guilds/SERVER İD /vanity-url HTTP/1.1\r\n` +
    `Host: canary.discord.com\r\n` +
    `Authorization: CLAIMER TOKEN\r\n` +
    `Content-Type: application/json\r\n` +
    `Content-Length: ${request_body.length}\r\n\r\n` +
    request_body
  );
};

async function mainLoop() {
  while (true) {
    const test_results = await Promise.all(ws_links.map(async (link) => {
      const l = new latenz();
      const test = await l.measure(link.replace("wss://", ""));
      const find = test.find((e) => e.key === "response");
      return { ...find, link };
    }));
    
    const selected = test_results.sort((a, b) => a.time - b.time)[0];
    console.log(`Seçilen Sunucu Msi(${selected.time}ms)`);
    start(selected.link);
    await new Promise((resolve) => setTimeout(resolve, 50000));
  }
}

mainLoop();