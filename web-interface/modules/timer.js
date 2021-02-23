const EventEmitter = require('events');

class Timer extends EventEmitter {
    constructor() {
        super()
        this.time = 0
        this.running = false
        this.nextTimeout = null
    }

    start() {
        this.running = true
        this.timerTick()
    }

    timerTick() {
        if (this.running) {
            this.time += 0.1

            this.emit('tick', this.time)

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
    }
}

module.exports = Timer