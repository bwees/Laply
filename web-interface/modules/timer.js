const EventEmitter = require('events');

class Timer extends EventEmitter {
    constructor() {
        super()
        this.time = 0
        this.running = false
        this.nextTimeout = null
        this.total = 0
    }

    start() {
        this.running = true
        this.timerTick()
    }

    timerTick() {
        if (this.running) {
            this.time += 0.1
            this.total += 0.1

            this.emit('tick', this.total)

            this.nextTimeout = setTimeout(() => this.timerTick(), 100)
        }
    }

    stop() {
        this.running = false
        clearTimeout(this.nextTimeout)
        return this.time
    }

    reset() {
        this.time = 0
        this.total = 0
    }

    resetLap() {
        this.time = 0
    }
}

module.exports = Timer