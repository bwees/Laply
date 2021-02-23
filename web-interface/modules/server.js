var express = require('express')
var http = require('http')
const EventEmitter = require('events');
const SocketServer = require('ws').Server;

class Server extends EventEmitter {
    constructor(port) {
        super();
        var app = express()
        http.createServer(app);

        // HTTP
        app.use(express.static('web'))

        var server = app.listen(port, function () {
            console.log('Server listening on port: ' + port)
        })

        // WEBSOCKETS
        this.wss = new SocketServer({ server });

        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                const params = message.split(" ");
                const cmd = params[0]
                params.shift()
                this.emit(cmd, params);
            });
            this.emit('new', ws)
        });
    }

    broadcast(message) {
        this.wss.clients.forEach(function each(client) {
            client.send(message);
        });
    }
}

module.exports = Server