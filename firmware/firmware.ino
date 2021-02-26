#include "rx5808.h"
#include "utils.h"
#include <Wire.h>

// ************SETTINGS************ //

// EXAMPLE CONFIGS IN THE configs/ DIRECTORY!

// List of channels to handle for this device (array with values ranging from 0-3)
// Change which channel set is used for each device you upload the firmware to
// Example, upload {0,1} to your first device and {2,3} to your second
//
// Example Configs:
// 1 Device = {0,1,2,3}
// 2 Devices = {0,1} and {2,3}
// 4 Devices = {0}, {1}, {2}, {3}

int channels[] = {2,3};

// Multidevice: Set to 1  if the device will be connected over USB and will be the Master. 
// Set to 2,3,4 etc. if the device will be a slave.  

// Single Device: Set this to 1. 
int deviceID = 2;

// Pins
#define PIN_SPI_DATA 10
#define PIN_SLAVE_SELECT 11
#define PIN_SPI_CLOCK 12

#define PIN_RSSI A6

// ******************************** //

RX5808 rx5808(PIN_RSSI, PIN_SPI_DATA, PIN_SLAVE_SELECT, PIN_SPI_CLOCK);

int pilotFrequencies[4] = {5658, 5732, 5806, 5880};
int numChannels = sizeof(channels)/sizeof(channels[0]);

void setup() {
  // Enable serial if the device is a master
  if (deviceID == 1) {
      Serial.begin(115200);
  }
  
  rx5808.init();
  Wire.begin(deviceID);
  Wire.onReceive(receiveData);
}

void loop() {
  // Command Handling
  if (deviceID == 1) { // if device is master, process serial commands
    if (Serial.available() > 0) {
      String command = Serial.readStringUntil('\n');
  
      if (command.indexOf("SETFREQ") >= 0) {
        distributeToSlaves(command); // distribute message to slaves

        // set frequencies
        int pilot = getValue(command, ':', 1).toInt();
        pilotFrequencies[pilot] = getValue(command, ':', 2).toInt();
      }
    }
  }
  rssiDump();
}

// Function outputs RSSI data when called to Serial
void rssiDump(void) {
  for (int i=0; i<numChannels; i++) {
    rx5808.setFrequency(pilotFrequencies[channels[i]]);
    delay(35); // Tuning time

    String msg = "RSSI_"; // data output creation
    msg += channels[i];
    msg += "-";
    msg += rx5808.readRssi();

    sendMessage(msg);
  }
}

void sendMessage(String msg) {
  if (deviceID == 1) { // if master, output to serial
      Serial.println(msg);      
  } else { // otherwise send to master for output
      Wire.beginTransmission(1);
      Wire.write(msg.c_str());
      Wire.endTransmission();
  }
}

void distributeToSlaves(String msg) {
  for (int i=2;i<=4; i++) { // distribute to up to 4 slaves
     Wire.beginTransmission(i);
     Wire.write(msg.c_str());
     Wire.endTransmission();
  }
}

void receiveData(int data) {
  String command; //command varaible to concat to

  while(Wire.available() > 0) // get string from i2c bus
  {
    char c = Wire.read(); // receive byte as a character
    command.concat(c); // add char to string
  }

  if (command.indexOf("SETFREQ") >= 0) {
    int pilot = getValue(command, ':', 1).toInt();
    pilotFrequencies[pilot] = getValue(command, ':', 2).toInt();
  } 
  
  if (deviceID == 1) { // output received data to serial if master
    Serial.println(command);
  }
}
