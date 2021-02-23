#include <movingAvg.h>

#include "settings.h"
#include "rx5808.h"

RX5808 rx5808(PIN_RSSI, PIN_SPI_DATA, PIN_SLAVE_SELECT, PIN_SPI_CLOCK);

int pilotFrequencies[4] = {5658, 5732, 5806, 5880};

bool dump = false;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("DEBUG: SERIAL ACTIVATED");

  rx5808.init();

  // Beeper
  pinMode(PIN_BEEPER, OUTPUT);
}

void loop() {

  if (Serial.available() > 0) {
    // read the incoming byte:
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
  
  if (dump) {
    rssiDump();
  }
}

void rssiDump(void) {
  String msg = "RSSI-";
  for (int i=0; i<4; i++) {
    rx5808.setFrequency(pilotFrequencies[i]);
    delay(35);

    msg += rx5808.readRssi();
    msg += ",";
  }
  
  Serial.println(msg);
}

String getValue(String data, char separator, int index)
{
    int found = 0;
    int strIndex[] = { 0, -1 };
    int maxIndex = data.length() - 1;

    for (int i = 0; i <= maxIndex && found <= index; i++) {
        if (data.charAt(i) == separator || i == maxIndex) {
            found++;
            strIndex[0] = strIndex[1] + 1;
            strIndex[1] = (i == maxIndex) ? i+1 : i;
        }
    }
    return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}
