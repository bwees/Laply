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
        this.dnfs = [false, false, false, false]
        this.bestTimes = [-1,-1,-1,-1]
        this.lapTimers = [new Timer(), new Timer(), new Timer(), new Timer()]
    }

    handleRssi(index, rssi, pilots, minTime) {
        this.pilots = pilots
        
        if (this.pilots[index].name == "") return // Ignore disabled names

        if (this.running) {
            if (rssi > this.pilots[index].rssi) { // If peak detected
                if (this.laps[index].length < this.numLaps) { // If pilot has not finished the max laps
                    this.recordLap(index, minTime);
                } else {
                    this.lapTimers[index].stop()
                    this.emit("checkStop")
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
                    this.lapTimers[index].resetLap()
                }

                if (lapTime < this.bestTimes[index] || this.bestTimes[index] == -1) {
                    this.bestTimes[index] = lapTime
                    this.emit("newBest", {datatype: "newBest", pilot: this.pilots[index].name, time: lapTime})
                }
        
                this.lapTable.table.unshift({ 
                    name: this.pilots[index].name, 
                    lapTime: lapTime, 
                    lapNum: this.laps[index].length, 
                    best: this.bestTimes[index],
                    datatype: "lap" 
                })
                this.emit("lap", this.lapTable)
                this.updateStandings()
            } else {
                pLaps.pop()
            }
        }
    }

    updateStandings(triggerPilot, tpIndex) {
        var standings = []

        for (i = 0; i < 4; i++) {
            standings.push({
                name: this.pilots[i].name,
                num: this.laps[i].length,
                time: this.laps[i][this.laps[i].length - 1] || 0,
                isDNF: this.dnfs[i]
            })
        }

        var noDNF = standings.filter(item => item.isDNF == false)
        var yesDNF = standings.filter(item => item.isDNF)

        noDNF.sort(function (a, b) {
            return b.num - a.num || a.time - b.time;
        });

        yesDNF.sort(function (a,b) {
            return b.num - a.num;
        })

        standings = noDNF.concat(yesDNF)
        
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