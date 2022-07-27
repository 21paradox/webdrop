<template>
  <div class="about">downloading</div>

  <button @click="reconnect">reconnect</button>
  <ul>
    <li v-for="(log, i) in logArr" :key="i">
      {{ log }}
    </li>
  </ul>
</template>

<script>
require('web-streams-polyfill');
// const streamSaver = require('streamsaver');
const nkn = require('nkn-sdk');
var FileSaver = require('file-saver');


const numSubClients = 4;
const sessionConfig = { mtu: 16000 };

async function readN(session, n) {
  let buf = new Uint8Array(0);
  while (buf.length < n) {
    buf = mergeUint8Array(buf, await session.read(n - buf.length));
  }
  return buf;
}

export async function readUint32(session) {
  let buf = await readN(session, 4);
  let dv = new DataView(buf.buffer);
  return dv.getUint32(0, true);
}

export async function writeUint32(session, n) {
  let buffer = new ArrayBuffer(4);
  let dv = new DataView(buffer);
  dv.setUint32(0, n, true);
  await session.write(new Uint8Array(buffer));
}

function mergeUint8Array(head, tail) {
  let merged = new Uint8Array(head.length + tail.length);
  merged.set(head);
  merged.set(tail, head.length);
  return merged;
}

export default {
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  data() {
    return {
      clientAddr: '',
      logArr: [],
    };
  },
  mounted() {
    const client = new nkn.MultiClient({
      numSubClients,
      sessionConfig,
      tls: true,
      rpcServerAddr: 'https://test-routes-lyart.vercel.app/proxy-https/mainnet-rpc-node-0001.nkn.org/mainnet/api/wallet'
    });
    const displayLog = (a) => {
      this.logArr.push(a);
    };
    this.client = client;
    client.listen();
    const remoteAddr = this.$route.query.remoteAddr;

    this.handShake = async () => {
      try {
        const res = await client.send(remoteAddr, 'a', {
          responseTimeout: 10 * 1000,
        });
        console.log(res);
      } catch (e) {
        console.log(e)
        displayLog(e.message);
      }
    }
    
    client.onConnect(async () => {
      this.clientAddr = client.addr;
      this.handShake()
    });

    client.onSession(async (session) => {
      console.log(
        session.localAddr,
        'accepted a session from',
        session.remoteAddr,
      );

      let fileNameLen = await readUint32(session);
      let fileNameEncoded = await readN(session, fileNameLen);
      let fileName = new TextDecoder().decode(fileNameEncoded);
      let fileSize = await readUint32(session);

      displayLog(
        `Start receiving ${fileName} (${fileSize} bytes) from ${session.remoteAddr}`,
      );

      let sessionStream = session.getReadableStream();
      // let downloadStream = streamSaver.createWriteStream(fileName, {
      //   size: fileSize,
      // });
      const resp = new Response(sessionStream)
      const blob = await resp.blob()
      FileSaver.saveAs(blob, fileName);

      // let timeStart = Date.now();
      // sessionStream.pipeTo(downloadStream).then(() => {
      //   displayLog(
      //     `Finish receiving file ${fileName} (${fileSize} bytes, ${
      //       (fileSize / (1 << 20) / (Date.now() - timeStart)) * 1000
      //     } MB/s)`,
      //   );
      // }, console.error);
    });
  },
  methods: {
    reconnect() {
      this.handShake()
    },
  },
};
</script>
