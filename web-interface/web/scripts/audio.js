var ws = new WebSocket("ws://" + window.location.host + "/ws");

var data = {}
var oldTableData = []
var timers = [0, 0, 0, 0]

var speech = new SpeechSynthesisUtterance();
speech.lang = "en";
speech.voice = getVoice();
speech.rate = 1

let synth = new Tone.Synth().toMaster();

ws.onopen = function () {
    // Web Socket is connected, send data using send()
    ws.send("DATA")
};

const urlParams = new URLSearchParams(window.location.search);

ws.onmessage = function(event) {
    if (Tone.context.state !== 'running') {
        Tone.context.resume();
    }

    if (JSON.parse(event.data).datatype === "settings") {
        data = JSON.parse(event.data)
    }

    if (JSON.parse(event.data).datatype === "raceOperation" && JSON.parse(event.data).operation == "start") {
        
        const now = Tone.now();
        for (i = 0; i < data.race.beeps; i++) {
            synth.triggerAttackRelease("440", "8n", now + i);
        }

        synth.triggerAttackRelease("600", "8n", now + data.race.beeps);
    }

    if (JSON.parse(event.data).datatype === "lapTable") {
        
        const now = Tone.now();

        lapTableData = JSON.parse(event.data)

        console.log("DATA: " + lapTableData.table)
        console.log("OLD: " + oldTableData)

        var difference = lapTableData.table.filter(x => oldTableData.findIndex(y => (y.lapNum == x.lapNum && y.name == x.name)) === -1)

        if (difference.length > 0) {
            synth.triggerAttackRelease("800", "8n", now);
        }

        if (urlParams.get('speech') == "on") {
            setTimeout(() => {
                difference.forEach(element => {
                    speech.text = element.name + " Lap " + element.lapNum + " " + (Math.round((element.lapTime/1000) * 10) / 10) 
                    window.speechSynthesis.speak(speech)
                })
            }, 200)
        }

        oldTableData = lapTableData.table
    }
}

function getVoice() {
    var voices = window.speechSynthesis.getVoices();
    var foundVoices = voices.filter(function(voice) 
    { 
        return voice.name == 'Alex'; 
    });
    return foundVoices[0]
}