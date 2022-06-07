<template>
  <div class="hello">
    <h1>Client Addr: {{ clientAddr }}</h1>
    <input id="file-input" type="file" @change="updateFile" />

    <button @click="genlink" v-show="clientAddr">generate link</button>
    <br />
    <br />
    <div>
    {{ linkUrl }}
    </div>
    <br />
    <br />
    <qrcode-vue :value="linkUrl" :size="300" level="H"  v-show="linkUrl"/>
  </div>

  <ul>
    <li v-for="(log, i) in logArr" :key="i">
        {{log}}
    </li>
  </ul>

</template>

<script>
require('web-streams-polyfill');

const webStreams = require('web-streams-node');
const fileReaderStream = require('filereader-stream');
// const streamSaver = require('streamsaver');
const nkn = require('nkn-sdk');
import QrcodeVue from 'qrcode.vue'


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

async function writeUint32(session, n) {
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
      files: [],
      clientAddr: '',
      linkUrl: '',
      logArr: []
    };
  },
  components: {
    QrcodeVue
  },
  mounted() {
    const client = new nkn.MultiClient({
      numSubClients,
      sessionConfig,
      tls: true,
    });
    client.listen();
    client.onConnect(() => {
      this.clientAddr = client.addr;
    });

    const displayLog = (a) => {
      this.logArr.push(a)
    }

    client.onMessage(async ({ src, payload }) => {
      console.log({ src, payload });
      const remoteAddr = src;
      if (payload === 'a') {
        let session = await client.dial(remoteAddr);
        session.setLinger(-1);
        console.log(
          session.localAddr,
          'dialed a session to',
          session.remoteAddr,
        );

        const file = this.files[0]
        if (!file) {
          return
        }

        let fileNameEncoded = new TextEncoder().encode(file.name);
        await writeUint32(session, fileNameEncoded.length);
        await session.write(fileNameEncoded);
        await writeUint32(session, file.size);

        displayLog(
          `Start sending ${file.name} (${file.size} bytes) to ${session.remoteAddr}`,
        );

        let uploadStream = webStreams.toWebReadableStream(
          fileReaderStream(file),
        );
        let sessionStream = session.getWritableStream(true);
        let timeStart = Date.now();
        uploadStream.pipeTo(sessionStream).then(() => {
          displayLog(
            `Finish sending file ${file.name} (${file.size} bytes, ${
              (file.size / (1 << 20) / (Date.now() - timeStart)) * 1000
            } MB/s)`,
          );
        }, console.error);
      }
    });
  },

  methods: {
    updateFile(e) {
      console.log(e.target.files);
      this.files = e.target.files;
    },
    genlink() {
      const basePath = window.location.href.replace(/#.+/, '');
      const linkNew =
        basePath +
        this.$router.resolve({
          name: 'download',
          query: {
            remoteAddr: this.clientAddr,
          },
        }).href;

      this.linkUrl = linkNew;
      return linkNew;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
