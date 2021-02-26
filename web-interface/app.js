const Server = require("./modules/server.js")
const Pilot = require("./modules/pilot.js")
const SerialPort = require('serialport')
const Race = require("./modules/race.js")
const Timer = require("./modules/timer.js")

var server = new Server(8000)

var data = {
    datatype: "settings",
    pilots: [
        new Pilot("Pilot1", 5658, 240),
        new Pilot("Pilot2", 5732, 240),
        new Pilot("Pilot3", 5806, 240),
        new Pilot("Pilot4", 5880, 240),
    ],
    serial: {
        ports: [],
        baudrate: 115200,
        port: "",
        connection: null,
        status: null
    },
    race: {
        laps: 3,
        beeps: 3,
        minTime: 10000,
        raceObj: null,
        lapTable: null,
        standings: null
    }
}

process.on('unhandledRejection', () => {}) // Supress warnings

const delay = ms => new Promise(res => setTimeout(res, ms))

server.on("new", (ws) => {
    updateClients()
})

server.on("PILOTSET", (params) => {
    var p = data.pilots[parseInt(params[0], 10)]

    p.name = params[1]
    if (p.frequency != parseInt(params[2], 10)) {
        p.frequency = parseInt(params[2], 10)
        if (data.serial.connection) {
            data.serial.connection.write('SETFREQ:' + parseInt(params[0], 10) + ":" + p.frequency + '\n')
        }
    }

    p.rssi = parseInt(params[3], 10)

    updateClients()
})

server.on("SERIAL", async (params) => {
    switch (params[0]) {
        case "AVAILABLE":
            getPortsList()
            break
        case "BAUD":
            data.serial.baudrate = parseInt(params[1], 10)
            break
        case "PORT":
            data.serial.port = params[1]
            break
        case "OPEN":
            data.serial.connection = new SerialPort(data.serial.port, { baudRate: data.serial.baudrate },
                function (err) {
                    if (err) {
                        console.log(err)
                        data.serial.connection = null
                        data.serial.status = false
                    } else {
                        data.serial.status = true
                    }
                    updateClients()
                }
            ).setEncoding("utf-8")

            await delay(2000)

            for (i = 0; i < 4; i++) {
                data.serial.connection.write('SETFREQ:' + i + ":" + data.pilots[i].frequency + '\n')
            }
            data.serial.connection.write('ENABLEDUMP\n')

            data.serial.connection.on('data', function (message) {
                message = message.toString()
                if (message.includes("RSSI")) {
                    frame = {
                        datatype: "rssi",
                    }

                    var header = message.split("-")[0]
                    var index = parseInt(header.split("_")[1], 10)
                    var rssi = parseInt(message.split("-")[1], 10)

                    frame.rssi = rssi
                    frame.index = index

                    server.broadcast(JSON.stringify(frame))

                    if (data.race.raceObj != null) {
                        if (data.race.raceObj.running) {
                            data.race.raceObj.handleRssi(index, rssi, data.pilots, data.race.minTime)
                        }
                    }
                }
            })

            data.serial.connection.on('error', function(err) {
                console.log('Error: ', err.message)
              })

            break

        case "CLOSE":
            if (data.serial.connection) {
                data.serial.connection.write('DISABLEDUMP\n')
                data.serial.connection.close()
                data.serial.connection = null
                data.serial.status = null
            }
            break
    }
    updateClients()
})

server.on("RACE", (params) => {
    switch (params[0]) {
        case "LAPS":
            data.race.laps = parseInt(params[1], 10)
            break

        case "BEEPS":
            data.race.beeps = parseInt(params[1], 10)
            break

        case "MIN":
            data.race.minTime = parseInt(params[1], 10)*1000 // convert to ms
            break

        case "START":
            setTimeout(() => {
                data.race.raceObj = new Race(data.race.laps)
                data.race.raceObj.running = true
                data.race.raceObj.on("lap", (lapTable) => {
                    server.broadcast(JSON.stringify(lapTable))
                    data.race.lapTable = lapTable
                })
                data.race.raceObj.on("tick", (timerData) => {
                    server.broadcast(JSON.stringify(timerData))
                })
                data.race.raceObj.on("standings", (standings) => {
                    server.broadcast(JSON.stringify(standings))
                    data.race.standings = standings
                })
                updateClients()
            }, (data.race.beeps*1000)+1000)

            break

        case "STOP":
            data.race.raceObj.running = false
            data.race.raceObj.stopTimers()
            break

        case "RESET":
            data.race.lapTable = null
            data.race.standings = null

            data.race.raceObj = new Race(data.race.laps)
            var resetStandings = data.race.raceObj.resetStandings(data.pilots)
            server.broadcast(JSON.stringify(resetStandings))

            for (var i=0; i<4; i++) {
                server.broadcast(JSON.stringify({datatype: "timerTick", pilot: i, time: 0}))
            }
            break
    }
    updateClients()
})

server.on("DATA", () => {
    updateClients()
    if (data.race.standings) {
        server.broadcast(JSON.stringify(data.race.standings))
    }
    if (data.race.lapTable) {
        server.broadcast(JSON.stringify(data.race.lapTable))
    }
})

function getPortsList() {
    var portsList = []

    SerialPort.list().then(ports => {
        ports.forEach((port) => {
            portsList.push(port.path)
        })

        portsList.reverse()

        data.serial.ports = portsList
        updateClients()
    })
}

function updateClients() {
    server.broadcast(JSON.stringify(data, getCircularReplacer()))
}

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
