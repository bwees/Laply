#include "rx5808.h"

// Channels to sent to the SPI registers
const uint16_t channelTable[] PROGMEM = {
  // Channel 1 - 8
  0x2A05, 0x299B, 0x2991, 0x2987, 0x291D, 0x2913, 0x2909, 0x289F,    // Band A
  0x2903, 0x290C, 0x2916, 0x291F, 0x2989, 0x2992, 0x299C, 0x2A05,    // Band B
  0x2895, 0x288B, 0x2881, 0x2817, 0x2A0F, 0x2A19, 0x2A83, 0x2A8D,    // Band E
  0x2906, 0x2910, 0x291A, 0x2984, 0x298E, 0x2998, 0x2A02, 0x2A0C,    // Band F / Airwave
  0x281D, 0x288F, 0x2902, 0x2914, 0x2987, 0x2999, 0x2A0C, 0x2A1E     // Band C / Immersion Raceband
};

// Channels with their Mhz Values
const uint16_t channelFreqTable[] PROGMEM = {
  // Channel 1 - 8
  5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725, // Band A
  5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866, // Band B
  5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945, // Band E
  5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880, // Band F / Airwave
  5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917  // Band C / Immersion Raceband
};

// All Channels of the above List ordered by Mhz
const uint8_t channelList[] PROGMEM = {
  19, 18, 32, 17, 33, 16, 7, 34, 8, 24, 6, 9, 25, 5, 35, 10, 26, 4, 11, 27, 3, 36, 12, 28, 2, 13, 29, 37, 1, 14, 30, 0, 15, 31, 38, 20, 21, 39, 22, 23
};


RX5808::RX5808(uint8_t _rssiPin, uint8_t _spiDataPin, uint8_t _slaveSelectPin, uint8_t _spiClockPin)
{
  rssiPin = _rssiPin;
  spiDataPin = _spiDataPin;
  slaveSelectPin = _slaveSelectPin;
  spiClockPin = _spiClockPin;
}

void RX5808::init()
{
  pinMode(rssiPin, INPUT);
  pinMode(slaveSelectPin, OUTPUT);
  pinMode(spiDataPin, OUTPUT);
  pinMode(spiClockPin, OUTPUT);
}

void RX5808::setFrequency(uint16_t frequency)
{
 uint8_t frequencyIndex = getFrequencyIndex(frequency);
 setFrequencyByIndex(frequencyIndex);
}

uint8_t RX5808::getFrequencyIndex(uint16_t frequency)
{
  for (uint8_t channelIndex = 0; channelIndex < sizeof(channelFreqTable); channelIndex++) {
    if (frequency == pgm_read_word_near(channelFreqTable + channelIndex)) return channelIndex;
  }
}

uint16_t RX5808::readRssi()
{
  volatile uint16_t rssi = 0;

  for (uint8_t i = 0; i < 5; i++) { // take 5 readings
    rssi += analogRead(rssiPin);
  }

  rssi = rssi / 5; // average of RSSI_READS readings

  return rssi;
}

void RX5808::waitRssi()
{
#ifdef MIN_TUNE_TIME
  delay(MIN_TUNE_TIME);
#endif
}

void RX5808::setFrequencyByIndex(uint8_t index)
{
  uint8_t i;
  uint16_t channelData;

  channelData = pgm_read_word_near(channelTable + index);

  // bit bash out 25 bits of data
  // Order: A0-3, !R/W, D0-D19
  // A0=0, A1=0, A2=0, A3=1, RW=0, D0-19=0
  serialEnable(HIGH);
  delayMicroseconds(1);
  serialEnable(LOW);

  serialSendBit(LOW);
  serialSendBit(LOW);
  serialSendBit(LOW);
  serialSendBit(HIGH);

  serialSendBit(LOW);

  // Remaining zeros
  for (i = 20; i > 0; i--) {
    serialSendBit(LOW);
  }

  // Clock the data in
  serialEnable(HIGH);
  delayMicroseconds(1);
  serialEnable(LOW);

  // Second is the channel data from the lookup table
  // 20 bytes of register data are sent, but the MSB 4 bits are zeros
  // register address = 0x1, write, data0-15=channelData data15-19=0x0
  serialEnable(HIGH);
  serialEnable(LOW);

  // Register 0x1
  serialSendBit(HIGH);
  serialSendBit(LOW);
  serialSendBit(LOW);
  serialSendBit(LOW);

  // Write to register
  serialSendBit(HIGH);

  // D0-D15
  // Note: Loop runs backwards as more efficent on AVR
  for (i = 16; i > 0; i--) {
    // Is bit high or low?
    if (channelData & 0x1) {
      serialSendBit(HIGH);
    } else {
      serialSendBit(LOW);
    }

    // Shift bits along to check the next one
    channelData >>= 1;
  }

  // Remaining D16-D19
  for (i = 4; i > 0; i--) {
    serialSendBit(LOW);
  }

  // Finished clocking data in
  serialEnable(HIGH);
  delayMicroseconds(1);

  digitalWrite(slaveSelectPin, LOW);
  digitalWrite(spiClockPin, LOW);
  digitalWrite(spiDataPin, LOW);

  // Wait to allow frequency to be tuned
  waitRssi();
}

void RX5808::serialSendBit(const uint8_t bit)
{
  digitalWrite(spiClockPin, LOW);
  delayMicroseconds(1);

  digitalWrite(spiDataPin, bit);
  delayMicroseconds(1);
  digitalWrite(spiClockPin, HIGH);
  delayMicroseconds(1);

  digitalWrite(spiClockPin, LOW);
  delayMicroseconds(1);
}

void RX5808::serialEnable(const uint8_t level)
{
  delayMicroseconds(1);
  digitalWrite(slaveSelectPin, level);
  delayMicroseconds(1);
}
