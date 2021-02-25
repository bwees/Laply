#include "rx5808.h"
#include "utils.h"

// ************SETTINGS************ //

// List of channels to handle for this device (array with values ranging from 0-3)
// Change which channel set is used for each device you upload the firmware to
// Example, upload {0,1} to your first device and {2,3} to your second
//
// Example Configs:
// 1 Device = {0,1,2,3}
// 2 Devices = {0,1} and {2,3}
// 4 Devices = {0}, {1}, {2}, {3}

int channels[] = {0,1,2,3};

// Pins
#define PIN_SPI_DATA 10
#define PIN_SLAVE_SELECT 11
#define PIN_SPI_CLOCK 12

#define PIN_RSSI A6

// ******************************** //

RX5808 rx5808(PIN_RSSI, PIN_SPI_DATA, PIN_SLAVE_SELECT, PIN_SPI_CLOCK);

int pilotFrequencies[4] = {5658, 5732, 5806, 5880};
int numChannels = sizeof(channels)/sizeof(channels[0]);
bool dump = false;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("DEBUG: SERIAL ACTIVATED");
  rx5808.init();
}

void loop() {
  // Command Handling
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');

    if (getValue(command, ':', 0).equals("SETFREQ")) {
      int pilot = getValue(command, ':', 1).toInt();
      pilotFrequencies[pilot] = getValue(command, ':', 2).toInt();
      Serial.println("SUCCESS-" + command);
    }

    else if (command.equals("ENABLEDUMP")) {
      dump = true;
      Serial.println("SUCCESS-" + command);
    }
    
    else if (command.equals("DISABLEDUMP")) {
      dump = false;
      Serial.println("SUCCESS-" + command);
    }
  }

  // Output
  if (dump) {
    rssiDump();
  }
}

// Function outputs RSSI data when called to Serial
void rssiDump(void) {
  for (int i=0; i<numChannels; i++) {
    rx5808.setFrequency(pilotFrequencies[channels[i]]);
    delay(35); // Tuning time

    String msg = "RSSI_";
    msg += channels[i];
    msg += "-";
    msg += rx5808.readRssi();

    Serial.println(msg);
  }
}
