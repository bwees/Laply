
var ws = new WebSocket("ws://" + window.location.host + "/ws");

var data = {}
var tableData = []
var timers = [0, 0, 0, 0]

ws.onopen = function () {
    // Web Socket is connected, send data using send()
    ws.send("DATA")
};

startBtn = document.getElementById("startRace")

var firstRun = true

var positions = []

document.addEventListener("DOMContentLoaded", function() {
    positions = []
    for (var i=1; i<=4; i++) {
        positions.push(document.getElementById("p"+i+"Card").getBoundingClientRect())
    }
})

window.addEventListener('resize', function() {
    positions = []
    for (var i=1; i<=4; i++) {
        positions.push(document.getElementById("p"+i+"Card").getBoundingClientRect())
    }
})

ws.onmessage = function (event) {
    if (JSON.parse(event.data).datatype === "settings") {
        data = JSON.parse(event.data)

        // Pilot Names
        document.getElementById("p1Name").textContent = data.pilots[0].name
        document.getElementById("p2Name").textContent = data.pilots[1].name
        document.getElementById("p3Name").textContent = data.pilots[2].name
        document.getElementById("p4Name").textContent = data.pilots[3].name

        // Start/Stop/Save Button Styling
        if (firstRun) {
            firstRun = false
            if (data.race.raceObj) {
                if (data.race.raceObj.running) {
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
        }

    } else if (JSON.parse(event.data).datatype === "lapTable") {
        lapTableData = JSON.parse(event.data)
        tableData = JSON.parse(event.data)

        table = document.getElementById("lapTable")
        clearLapTable(table)

        lapTableData.table.forEach((lapData) => {
            row = table.insertRow(1);

            pilotName = row.insertCell(0);
            lapNum = row.insertCell(1);
            lapTime = row.insertCell(2);

            pilotName.innerHTML = lapData.name
            lapNum.innerHTML = lapData.lapNum + "/" + data.race.laps
            lapTime.innerHTML = lapData.lapTime / 1000
        });

        if (canSave())
            enableSave()
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
        timers[timerData.pilot] = timerData.time

    } else if (JSON.parse(event.data).datatype === "standings") {
        var standings = JSON.parse(event.data)
        data.race.standings = standings.standings
        updateStandings(standings)
    } else if (JSON.parse(event.data).datatype === "newBest") {
        var bestData = JSON.parse(event.data)

        var pre = getBoxPrefixFromName(bestData.pilot)
        document.getElementById(pre + "Best").textContent = (bestData.time == -1 ? "BEST: --:--.-" : "BEST: " + secsFormat(bestData.time / 1000))

    } else if (JSON.parse(event.data).datatype === "raceOperation") {
        switch (JSON.parse(event.data).operation) {
            case "start":
                startProcess()
                break
            case "stop":
                stopProcess()
                break
            case "reset":
                resetRace()
                break
        }
    }
}

function startRace() {

    if (startBtn.innerHTML === "Start") {

        ws.send("RACE START")
    } else if (startBtn.innerHTML = "Stop") {

        ws.send("RACE STOP")
    }
}

function stopProcess() {
    startBtn.classList.remove("btn-danger");
    startBtn.classList.add("btn-success");
    startBtn.innerHTML = "Start";

    data.race.raceObj.running = false;
    if (canSave()) {
        enableSave();
    }
}

function startProcess() {
    startBtn.classList.remove("btn-success");
    startBtn.classList.add("btn-danger");
    startBtn.innerHTML = "Stop";
    disableSave();
}

function clearLapTable(table) {
    var rowCount = table.rows.length;
    for (var x = rowCount - 1; x > 0; x--) {
        table.deleteRow(x);
    }
}

function secsFormat(secs) {
    var hours = Math.floor(secs / 3600);
    var minutes = Math.floor((secs - (hours * 3600)) / 60);
    var seconds = secs - (hours * 3600) - (minutes * 60);

    seconds = Math.round(seconds * 10) / 10

    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    if (seconds % 1 == 0) { seconds = seconds + ".0" }
    return minutes + ':' + seconds;
}

function resetRace() {
    if (startBtn.innerHTML === "Start") {
        clearLapTable(document.getElementById('lapTable'))
        disableSave()

        document.getElementById("p1Best").textContent = "BEST: --:--.-"
        document.getElementById("p2Best").textContent = "BEST: --:--.-"
        document.getElementById("p3Best").textContent = "BEST: --:--.-"
        document.getElementById("p4Best").textContent = "BEST: --:--.-"

    }
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

        var saveData = []
        tableData.table.forEach((lapData) => {
            saveData.unshift([
                lapData.name,
                lapData.lapNum,
                lapData.lapTime / 1000
            ])
        });

        saveData.unshift(["PILOT NAME", "LAP NUM", "LAP TIME"])

        exportToCsv(raceName + ".csv", saveData);
    }
}

function updateStandings(standings) {
    standings.standings.forEach((standing, index) => {
        var prefix = getBoxPrefixFromName(standing.name)
        moveToPosition(document.getElementById(prefix+"Card"), positions[index])
    })

    setTimeout(() => solidifyStandings(standings), 600)
}

async function moveToPosition(toMove, ref) {
    const offset = {
        x: null,
        y: null,
    };

    toMove.classList.add('transition');

    offset.x = ref.left - toMove.getBoundingClientRect().left
    offset.y = ref.top - toMove.getBoundingClientRect().top


    toMove.style.transform = `translate(${offset.x}px, ${offset.y}px)`;

    setTimeout(() => {            
        toMove.classList.remove('transition');
        toMove.removeAttribute('style');
    }, 600);
}

function solidifyStandings(standings) {
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

    for (var i = 0; i < 4; i++) {
        if (data.pilots[i].name === name) {
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


// CSV EXPORT 

function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };
    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style = "visibility:hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function copyRace() {
    var order = ["p1", "p2", "p3", "p4"]
    var final = ""
    order.forEach(pre => {
        final += (1+data.race.standings.indexOf(data.race.standings.filter(obj => getBoxPrefixFromName(obj.name) == pre)[0])) + "\n"
    })
    
    let textArea = document.createElement("textarea");
    textArea.value = final;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => {
        // here the magic happens
        document.execCommand('copy') ? res() : rej();
        textArea.remove();
    });
}