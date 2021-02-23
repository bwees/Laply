# Laply

Laply is based on nodeJS and Argon Dashboard. Laply utilizes a serial connction between an Arduino Nano and RX5808. 


## Installation

### Arduino
1. Download the latest firmware from [Releases](https://github.com/bwees/Laply/releases).
2. Open the ```firmware.ino``` sketch in Arduino IDE and flash it to an Arduino Nano (other boards can work but are not tested)
3. Wire the RX5808 module according to the schematic below.
4. Open serial monitor and send ```ENABLEDUMP``` to the Arduino. You should see repeating output similar to ```RSSI-120,132,123,144```

### NodeJS Server
These instructions have to a Raspberry Pi 3B, 3B+, 4B. Step 1 will be specific to your device and its nodeJS install steps.

1. Install NodeJS on Raspberry Pi ([Reference](https://www.w3schools.com/nodejs/nodejs_raspberrypi.asp))
```
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

2. Laply Install
```
git clone https://github.com/bwees/Laply
cd web-interface
npm i
```

## Usage

### Starting Laply Server
1. Navigate to the ```web-interface/``` directory
2. Run ```node app.js```
3. Navigate to ```http://<RASPBERRY PI IP>:8000```

### Using Laply
Video coming soon
