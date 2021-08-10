
var ws = new WebSocket("ws://" + window.location.host + "/ws");

document.getElementById("devicePort").options.length = 0;

ws.onopen = function () {
    ws.send("SERIAL AVAILABLE")
    ws.send("DATA")
};

var data = null;

try {
    ws.send("SERIAL AVAILABLE")
} catch {}

rssiValInterval = 0

ws.onmessage = function (event) {

    if (JSON.parse(event.data).datatype === "settings") {
        var nameUpdate = data == null

        data = JSON.parse(event.data)
        // Port Selection
        var portSelector = document.getElementById("devicePort")

        if (portSelector.length == 0) { // Only on first load
            data.serial.ports.forEach(element => {
                var option = document.createElement("option")
                option.text = element
                portSelector.add(option)
            });

            if (data.serial.connection) {
                portSelector.selectedIndex = data.serial.ports.findIndex((element) => element == data.serial.port)
            } else {
                setPort(data.serial.ports[0])
            }
        }


        // Port Baudrate
        var baudField = document.getElementById("deviceBaud")
        baudField.value = data.serial.baudrate

        // Serial Alerts
        if (data.serial.status === null) {
            document.getElementById("connectionSuccess").hidden = true
            document.getElementById("connectionFailed").hidden = true
        } else if (data.serial.status === true) {
            document.getElementById("connectionSuccess").hidden = false
            document.getElementById("connectionFailed").hidden = true
        } else if (data.serial.status === false) {
            document.getElementById("connectionSuccess").hidden = true
            document.getElementById("connectionFailed").hidden = false
        }

        // Serial Settings Disable
        var connButton = document.getElementById("connectionButton")

        if (data.serial.connection != null) {
            connButton.innerHTML = "Disconnect"
            baudField.disabled = true
            portSelector.disabled = true
        } else {
            connButton.innerHTML = "Connect"
            baudField.disabled = false
            portSelector.disabled = false
        }

        // Race Laps
        var raceLaps = document.getElementById("raceLaps")
        raceLaps.value = data.race.laps

        // Race Beeps
        var raceBeeps = document.getElementById("raceBeeps")
        raceBeeps.value = data.race.beeps

        // Race Min Time
        var raceMinTime = document.getElementById("raceMinTime")
        raceMinTime.value = data.race.minTime/1000

        // Pilot Info

        if (nameUpdate) {
            document.getElementById("pilot1Name").value = data.pilots[0].name
            document.getElementById("pilot2Name").value = data.pilots[1].name
            document.getElementById("pilot3Name").value = data.pilots[2].name
            document.getElementById("pilot4Name").value = data.pilots[3].name
        }

        document.getElementById("pilot1Freq").value = data.pilots[0].frequency
        document.getElementById("pilot1Thresh").value = data.pilots[0].rssi

        document.getElementById("pilot2Freq").value = data.pilots[1].frequency
        document.getElementById("pilot2Thresh").value = data.pilots[1].rssi

        document.getElementById("pilot3Freq").value = data.pilots[2].frequency
        document.getElementById("pilot3Thresh").value = data.pilots[2].rssi

        document.getElementById("pilot4Freq").value = data.pilots[3].frequency
        document.getElementById("pilot4Thresh").value = data.pilots[3].rssi

    } else if (JSON.parse(event.data).datatype === "rssi") {
        
        rssiData = JSON.parse(event.data)
        rssiData.data.forEach((element, i) => {

            var prefix = "p" + (i+1)
            document.getElementById(prefix+"RssiLabel").textContent = "RSSI: " + element
            if (rssiValInterval == 8) {
                document.getElementById(prefix+"RssiBar").style.width = ((element / 250) * 100) + "%"
            }
        })

        if (rssiValInterval == 8) {
            rssiValInterval = 0
        } else {
            rssiValInterval += 1
        }

    }

}

function openConnection() {
    if (data.serial.connection === null) {
        ws.send("SERIAL OPEN")
    } else {
        ws.send("SERIAL CLOSE")
    }
}

function setBaud(baud) {
    ws.send("SERIAL BAUD " + baud)
}

function setPort(port) {
    ws.send("SERIAL PORT " + port)
}

function setRaceLaps(laps) {
    ws.send("RACE LAPS " + laps)
}

function setRaceBeeps(beeps) {
    ws.send("RACE BEEPS " + beeps)
}

function setRaceMinTime(time) {
    ws.send("RACE MIN " + time)
}

function setPilot1Info() {
    var pilot1Name = document.getElementById("pilot1Name").value.split(' ').join('_')
    var pilot1Freq = document.getElementById("pilot1Freq").value
    var pilot1Thresh = document.getElementById("pilot1Thresh").value
    ws.send("PILOTSET 0 " + pilot1Name + " " + pilot1Freq + " " + pilot1Thresh)
}
function setPilot2Info() {
    var pilot2Name = document.getElementById("pilot2Name").value.split(' ').join('_')
    var pilot2Freq = document.getElementById("pilot2Freq").value
    var pilot2Thresh = document.getElementById("pilot2Thresh").value
    ws.send("PILOTSET 1 " + pilot2Name + " " + pilot2Freq + " " + pilot2Thresh)
}
function setPilot3Info() {
    var pilot3Name = document.getElementById("pilot3Name").value.split(' ').join('_')
    var pilot3Freq = document.getElementById("pilot3Freq").value
    var pilot3Thresh = document.getElementById("pilot3Thresh").value
    ws.send("PILOTSET 2 " + pilot3Name + " " + pilot3Freq + " " + pilot3Thresh)
}
function setPilot4Info() {
    var pilot4Name = document.getElementById("pilot4Name").value.split(' ').join('_')
    var pilot4Freq = document.getElementById("pilot4Freq").value
    var pilot4Thresh = document.getElementById("pilot4Thresh").value
    ws.send("PILOTSET 3 " + pilot4Name + " " + pilot4Freq + " " + pilot4Thresh)
}

document.addEventListener('paste', (event) => {
    let paste = (event.clipboardData || window.clipboardData).getData('text');
    
    if (paste.split("\n").length == 4) {
        event.preventDefault();

        var p = 1
        paste.split("\n").forEach(line => {
            if (p <= 4) {
                try {
                    document.getElementById("pilot"+p+"Name").value = line.split("	")[0]
                } catch {}
            }
            p++;
        })
    } 
});