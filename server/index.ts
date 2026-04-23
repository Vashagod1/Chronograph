import dgram from 'node:dgram';
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
    console.log(`Получен пакет: ${msg.length} байт от ${rinfo.address}`);
})

server.on('listening', () => {
    const address = server.address();
    console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

server.on('error', (err) => {
    console.log(`Ошибка сервера:\n${err.stack}`);
    server.close();
})

server.bind(20777);