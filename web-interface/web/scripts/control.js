
var ws = new WebSocket("ws://" + window.location.host + "/ws");

data = {}

ws.onopen = function () {
    // Web Socket is connected, send data using send()
    ws.send("DATA")
};

startBtn = document.getElementById("startRace")

ws.onmessage = function (event) {
    if (JSON.parse(event.data).datatype === "settings") {
        data = JSON.parse(event.data)

        // Pilot Names
        document.getElementById("p1Name").textContent = data.pilots[0].name
        document.getElementById("p2Name").textContent = data.pilots[1].name
        document.getElementById("p3Name").textContent = data.pilots[2].name
        document.getElementById("p4Name").textContent = data.pilots[3].name

        // Start/Stop/Save Button Styling
        if (data.race.raceObj) {
            if(data.race.raceObj.running) {
                startBtn.classList.remove("btn-success");
                startBtn.classList.add("btn-danger");
                startBtn.innerHTML = "Stop"
                disableSave()
            } else {
                startBtn.classList.remove("btn-danger");
                startBtn.classList.add("btn-success");
                startBtn.innerHTML = "Start"
                if (canSave()) {
                    enableSave()
                }
            }
        }

    } else if (JSON.parse(event.data).datatype === "lapTable") {

        lapTableData = JSON.parse(event.data)
        console.log(lapTableData)
        table = document.getElementById("lapTable")
        clearLapTable(table)

        lapTableData.table.forEach((lapData) => {
            row = table.insertRow(1);
    
            pilotName = row.insertCell(0);
            lapNum = row.insertCell(1);
            lapTime = row.insertCell(2);
            pace = row.insertCell(3);
    
            pilotName.innerHTML = lapData.name
            lapNum.innerHTML = lapData.lapNum + "/" + data.race.laps
            lapTime.innerHTML = lapData.lapTime/1000
            pace.innerHTML = "+0:00"
        });
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

        timerLabel.textContent = secsFormat(timerData.time)

    } else if (JSON.parse(event.data).datatype === "standings") {
        var standings = JSON.parse(event.data)
        updateStandings(standings)
    }
}

function startRace() {

    if (startBtn.innerHTML === "Start") {
        
        let synth = new Tone.Synth().toMaster();

        const now = Tone.now()
        for (i = 0; i < data.race.beeps; i++) {
            synth.triggerAttackRelease("440", "8n", now + i)
        }

        synth.triggerAttackRelease("600", "8n", now + data.race.beeps)

        ws.send("RACE START")
    } else {
        ws.send("RACE STOP")
    }
}

function clearLapTable(table) {
    var rowCount = table.rows.length;
    for (var x=rowCount-1; x>0; x--) {
        table.deleteRow(x);
    }
    disableSave()
}

function secsFormat(secs) {
    var hours   = Math.floor(secs / 3600);
    var minutes = Math.floor((secs - (hours * 3600)) / 60);
    var seconds = secs - (hours * 3600) - (minutes * 60);

    seconds = Math.round(seconds * 10) / 10

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if (seconds % 1 == 0) {seconds = seconds+".0"}
    return "+"+minutes+':'+seconds;
}

function resetRace() {
    clearLapTable(document.getElementById('lapTable'))
    disableSave()
    ws.send("RACE RESET")
}

function enableSave() {
    document.getElementById("saveRace").disabled = false
}

function disableSave() {
    document.getElementById("saveRace").disabled = true
}

function canSave() {
    if (document.getElementById("lapTable").rows.length > 1) { // If laps are not empty
        if (!data.race.raceObj.running) { // if we are not running
            return true;
        }
    } 

    return false
}

function saveRace() {
    var raceName = window.prompt("Please enter a name for the race", "Race Name")
    if (raceName != null && raceName != "") {
        console.log("YAY")
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