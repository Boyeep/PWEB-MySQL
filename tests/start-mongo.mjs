import { MongoMemoryServer } from 'mongodb-memory-server-core';
const server=await MongoMemoryServer.create({binary:{version:'8.0.17'},instance:{port:27028,dbName:'pweb_mysql_lab',ip:'127.0.0.1'}});
console.log('MongoDB QA siap di mongodb://127.0.0.1:27028 (database uji sementara, bukan mock).');
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{await server.stop();process.exit(0);});
await new Promise(()=>{});
