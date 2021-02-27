<img src="https://github.com/bwees/Laply/raw/master/docs/logo.png?raw=true" width="350" title="hover text">

Laply is based on nodeJS and Argon Dashboard. Laply utilizes a serial connction between an Arduino Nano and RX5808. 


## Installation

### Arduino
1. Download the latest firmware from [Releases](https://github.com/bwees/Laply/releases).
2. Read the instructions for the settings in ```firmware.ino```. There are example settings in the ```fimware/configs/``` folder
4. Open the ```firmware.ino``` sketch in Arduino IDE and flash it to an Arduino Nano (other boards can work but are not tested)
5. Wire the RX5808 module according to the schematic found [here](https://github.com/bwees/Laply/blob/master/docs/schematic.png).
6. Open the serial monitor and you should see repeating output similar to ```RSSI_0-120```

### NodeJS Server
These instructions have been tested on a Raspberry Pi 3B+. Step 1 will be specific to your device and its nodeJS install steps.

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
cd Laply/web-interface
npm i
```

## Usage

### Starting Laply Server
1. Navigate to the ```web-interface/``` directory
2. Run ```node app.js```
3. Navigate to ```http://<RASPBERRY PI IP>:8000```

### Using Laply
Video coming soon
