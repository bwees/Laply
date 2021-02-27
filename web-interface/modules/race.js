const EventEmitter = require('events');
const Timer = require('./timer');

class Race extends EventEmitter {

    constructor(numLaps) {
        super()
        this.running = false;
        this.laps = [[], [], [], []]
        this.numLaps = numLaps
        this.pilotStartTimes = [null, null, null, null]
        this.lapTable = {
            datatype: "lapTable",
            table: []
        }
        this.lapTimers = [new Timer(), new Timer(), new Timer(), new Timer()]
    }

    handleRssi(index, rssi, pilots, minTime) {
        this.pilots = pilots
        if (this.running) {
            if (rssi > this.pilots[index].rssi) { // If peak detected
                if (this.laps[index].length < this.numLaps) { // If pilot has not finished the max laps
                    this.recordLap(index, minTime);
                } else {
                    this.lapTimers[index].stop()
                }
            }
        }
    }

    recordLap(index, min) {
        var pLaps = this.laps[index]

        if (!this.pilotStartTimes[index]) {
            this.pilotStartTimes[index] = new Date();
            this.lapTimers[index].start()
            this.lapTimers[index].on('tick', (time) => {
                this.emit('tick', {datatype: "timerTick", pilot: index, time: time})
            })
        } else {
            pLaps.push(new Date() - this.pilotStartTimes[index])
            var lapTime = this.getLapTime(index)

            if (lapTime >= min) {
                if (pLaps.length < this.numLaps) {
                    this.lapTimers[index].reset()
                }
        
                this.lapTable.table.unshift({ 
                    name: this.pilots[index].name, 
                    lapTime: lapTime, 
                    lapNum: this.laps[index].length, 
                    datatype: "lap" 
                })
                this.emit("lap", this.lapTable)
            } else {
                pLaps.pop()
            }

        }
        this.updateStandings()
    }

    async updateStandings() {
        var standings = []

        for (i = 0; i < 4; i++) {
            standings.push({
                name: this.pilots[i].name,
                num: this.laps[i].length,
                time: this.laps[i][this.laps[i].length - 1] || 0
            })
        }

        standings.sort(function (a, b) {
            return b.num - a.num || a.time - b.time;
        });

        this.emit("standings", {datatype: "standings", standings: standings})
    }

    resetStandings(pilots) {
        var standings = []
        pilots.forEach((pilot, index) => {
            standings.push({
                name: pilot.name,
                num: 0,
                time: 0
            })
        })
        return {datatype: "standings", standings: standings}
    }

    getLapTime(i) {
        var laps = this.laps[i]
        if (laps.length === 1) {
            return laps[0]
        } else {
            var currentLap = laps[laps.length - 1]
            var lastLap = laps[laps.length - 2]
        }

        return currentLap - lastLap
    }

    stopTimers() {
        this.lapTimers.forEach(function (timer, index) {
            timer.stop()
        });
    }
}

module.exports = Race