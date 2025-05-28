# ESP32 Smart Trash Bin

This repository contains multiple versions of an ESP32-based smart trash bin system with ultrasonic sensor and servo-controlled lid, integrated with Blynk IoT platform.

## File Descriptions

1. **`esp32trash.ino`**  
   Basic version with:

   - Ultrasonic distance measurement
   - Servo-controlled lid (opens when object is within 15cm)
   - Serial monitor output

2. **`esp32trash_blynk.ino`**  
   Adds Blynk integration for:

   - Distance monitoring (V0)
   - Lid status (V1)
   - Trash count (V2)

3. **`esp32trash_blynk2.ino`**  
   Enhanced version with:

   - Manual lid control via Blynk button (V3)
   - Automatic/Manual mode switching

4. **`esp32trash_blynk4.ino`**  
   Optimized version with:
   - Metrics toggle (V4) to conserve message quota
   - Separate timers for sensor checks and data transmission
   - Improved debounce logic

## Hardware Requirements

- ESP32 board
- HC-SR04 Ultrasonic Sensor
- Micro Servo (SG90)
- Jumper wires
- Power supply

## Setup Instructions

1. Install required libraries:

   - `ESP32Servo`
   - `BlynkSimpleEsp32`

2. Configure in each file:

   - WiFi credentials (`ssid`, `pass`)
   - Blynk authentication (`BLYNK_AUTH_TOKEN`)
   - Device template IDs (for Blynk versions)

3. Upload to ESP32 and monitor via Serial (115200 baud)

## Pin Configuration

- Ultrasonic: TRIG=GPIO27, ECHO=GPIO13
- Servo: GPIO14

## Blynk Virtual Pins

- V0: Distance (cm)
- V1: Lid status (Open/Closed)
- V2: Trash count
- V3: Manual control button
- V4: Metrics toggle (in blynk4 version)
