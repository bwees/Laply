class MovingAverage {
    constructor(numPoints) {
        this.numPoints = numPoints
        this.dataPoints = []
    }

    dataPoint(point) {
        if (this.dataPoints.length < this.numPoints) {
            this.dataPoints.push(point)
        } else {
            this.dataPoints.shift()
            this.dataPoints.push(point)
        }

        return this.getAvg()
    }

    getAvg() {
        var sum = 0
        this.dataPoints.forEach((element, i) => {
            sum += element
        })

        return Math.round(sum / this.dataPoints.length)
    }

    clearData() {
        this.dataPoints = []
    }
}

module.exports = MovingAverage