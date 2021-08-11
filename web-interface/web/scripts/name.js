var ws = new WebSocket("ws://" + window.location.host + "/ws");

ws.onopen = function () {
    // Web Socket is connected, send data using send()
    ws.send("DATA")
};

const urlParams = new URLSearchParams(window.location.search)

ws.onmessage = function (event) {
    if (JSON.parse(event.data).datatype === "settings") {
        // Pilot Names
        document.getElementById("name").textContent = JSON.parse(event.data).pilots[urlParams.get("pilot")].name
    }
}