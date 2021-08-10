#include "rx5808.h"
#include "utils.h"
#include <Wire.h>

// ************SETTINGS************ //

// List of channels to handle for this device (array with values ranging from 0-3)
// Change which channel set is used for each device you upload the firmware to
// Example, upload {0,1} to your first device and {2,3} to your second
//
// Example Configs:
// 1 Device = {0,1,2,3}
// 2 Devices = {0,1} and {2,3}
// 4 Devices = {0}, {1}, {2}, {3}

int channels[] = {0, 1, 2, 3};

// Multidevice: Set to 1  if the device will be connected over USB and will be the Master.
// Set to 2,3,4 etc. if the device will be a slave.

// Single Device: Set this to 1.
int deviceID = 1;

// Pins
#define PIN_SPI_DATA 10
#define PIN_SLAVE_SELECT 11
#define PIN_SPI_CLOCK 12
const int buttonPins[] = {5, 4, 3, 2};
int pilotFrequencies[4] = {5658, 5732, 5843, 5917};


// ******************************** //


int numChannels = sizeof(channels) / sizeof(channels[0]);

void setup()
{
    // put your setup code here, to run once:
    if (deviceID == 1)
    {
        Serial.begin(115200);
    }

    sendMessage("DEBUG: SERIAL ACTIVATED");

    pinMode(5, INPUT_PULLUP);
    pinMode(4, INPUT_PULLUP);
    pinMode(3, INPUT_PULLUP);
    pinMode(2, INPUT_PULLUP);

}

void loop()
{
  // Command Handling
    if (deviceID == 1)
    {
        if (Serial.available() > 0)
        {
            String command = Serial.readStringUntil('\n');

            if (command.indexOf("SETFREQ") >= 0)
            {
                int pilot = getValue(command, ':', 1).toInt();
                pilotFrequencies[pilot] = getValue(command, ':', 2).toInt();
                sendMessage(String(deviceID) + "-SUCCESS-" + command);
            }
        }
    }
    rssiDump();
}

// Function outputs RSSI data when called to Serial
void rssiDump(void)
{
    for (int i = 0; i < 4; i++)
    {
        delay(35); // Tuning time

        int bPress = digitalRead(buttonPins[i]);

        String msg = "RSSI_";
        msg += channels[i];
        msg += "-";
        if (bPress==LOW) {
          msg += 260;
        } else {
          msg += 0;
        }

        sendMessage(msg);
    }
}

void sendMessage(String msg)
{
    if (deviceID == 1)
    {
        Serial.println(msg);
    }
    else
    {
        Wire.beginTransmission(1);
        Wire.write(msg.c_str());
        Wire.endTransmission();
    }
}
