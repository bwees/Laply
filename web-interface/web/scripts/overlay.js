var ws = new WebSocket("ws://" + window.location.host + "/ws");

ws.onopen = function () {
    // Web Socket is connected, send data using send()
    ws.send("DATA")
};

startBtn = document.getElementById("startRace")

var firstRun = true

ws.onmessage = function (event) {
    if (JSON.parse(event.data).datatype === "settings") {
        data = JSON.parse(event.data)

        // Pilot Names
        document.getElementById("p1Name").textContent = data.pilots[0].name
        document.getElementById("p2Name").textContent = data.pilots[1].name
        document.getElementById("p3Name").textContent = data.pilots[2].name
        document.getElementById("p4Name").textContent = data.pilots[3].name


    } else if (JSON.parse(event.data).datatype === "timerTick") {
        var timerData = JSON.parse(event.data)
        timerData.time = Math.round(timerData.time * 10) / 10;

        switch (timerData.pilot) {
            case 0:
                timerLabel = document.getElementById("timer1")
                break;
            case 1:
                timerLabel = document.getElementById("timer2")
                break;
            case 2:
                timerLabel = document.getElementById("timer3")
                break;
            case 3:
                timerLabel = document.getElementById("timer4")
                break;
        }

        timerLabel.textContent = "+" + secsFormat(timerData.time)

    } else if (JSON.parse(event.data).datatype === "standings") {
        var standings = JSON.parse(event.data)
        data.race.standings = standings.standings
        updateStandings(standings)
    } else if (JSON.parse(event.data).datatype === "newBest") {
        var bestData = JSON.parse(event.data)

        var pre = getBoxPrefixFromName(bestData.pilot)
        document.getElementById(pre + "Best").textContent = (bestData.time == -1 ? "BEST: --:--.-" : "BEST: " + secsFormat(bestData.time/1000))
    }
}


function updateStandings(standings) {
    var rowDiv = document.getElementById("standingsDiv")
    standings.standings.forEach((standing, position) => {
        var pre = getBoxPrefixFromName(standing.name)
        var toMove = document.getElementById(pre + "Card")

        var refChild = document.getElementById(rowDiv.children[position].id)

        if (position != 3) {
            rowDiv.insertBefore(toMove, refChild)
        } else {
            insertAfter(rowDiv, toMove, refChild)
        }

        document.getElementById(pre+"Pos").textContent = position + 1
    })
}

function getBoxPrefixFromName(name) {
    var found = ""

    for (var i=0; i <4; i++) {
        if (data.pilots[i].name === name ) {
            found = i
        }
    }

    switch (found) {
        case 0:
            return "p1"
        case 1:
            return "p2"
        case 2:
            return "p3"
        case 3:
            return "p4"   
    }
}

function insertAfter(element, newNode, existingNode) {
    element.insertBefore(newNode, existingNode.nextSibling);
}

function getPaceText(pilotName) {
    // Get Race Standing
    if (!data.race.standings) return ""
    var standing = data.race.standings.filter(record => record.name == pilotName)[0]
    var position = data.race.standings.indexOf(standing)
    
    var leaderPace = data.race.standings[0].time
    if (position==0 || (standing.time - leaderPace) <= 0) return ""
    return "PACE: +" + Math.round(((standing.time - leaderPace) / 1000) * 10) / 10 + "s"
}

function secsFormat(secs) {
    var hours   = Math.floor(secs / 3600);
    var minutes = Math.floor((secs - (hours * 3600)) / 60);
    var seconds = secs - (hours * 3600) - (minutes * 60);

    seconds = Math.round(seconds * 10) / 10

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if (seconds % 1 == 0) {seconds = seconds+".0"}
    return minutes+':'+seconds;
}