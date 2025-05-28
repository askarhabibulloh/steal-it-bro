//kode ini ditambah metris limiter untuk menghemat message quota
#define BLYNK_DEVICE_NAME ""
#define BLYNK_TEMPLATE_ID ""
#define BLYNK_TEMPLATE_NAME ""
#define BLYNK_AUTH_TOKEN ""
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <ESP32Servo.h>

// WiFi credentials
char ssid[] = "";
char pass[] = "";

// Blynk virtual pins
#define V_DISTANCE V0       // Display distance
#define V_LID_STATUS V1     // Lid status: open/closed
#define V_TRASH_COUNT V2    // Trash count
#define V_MANUAL_CONTROL V3 // Manual control button
#define V_SEND_METRICS V4   // Switch to enable/disable metrics

Servo myServo;
#define ECHO_PIN 13
#define TRIG_PIN 27
#define SERVO_PIN 14

long duration;
int distance;
int trashCount = 0;
bool isManualOpen = false; // To track manual control state
bool sendMetrics = false;   // Flag to enable/disable sending metrics

BlynkTimer timer;

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, pass);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  myServo.attach(SERVO_PIN);
  myServo.write(0);  // Lid closed by default

  // Separate timers for data sending and servo operation
  timer.setInterval(100L, checkDistance);     // Check distance every 100 ms
  timer.setInterval(1000L, sendDataToBlynk);  // Send data every 1 second
}

int measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);
  return duration / 58.2;
}

void openLid() {
  myServo.write(90); // Open lid (servo angle at 90°)
  delay(2000);       // Keep lid open for 2 seconds
  myServo.write(0);  // Close lid (servo angle back to 0°)
}

void checkDistance() {
  if (!isManualOpen) { // Ensure manual mode does not interfere
    distance = measureDistance();

    // Automatically open lid if object is close
    if (distance <= 15) {
      openLid();
      trashCount++; // Increment trash count
      delay(2000);  // Debounce to avoid multiple counts
    }
  }
}

void sendDataToBlynk() {
  if (sendMetrics) {
    // Send metrics to Blynk
    Blynk.virtualWrite(V_DISTANCE, distance);

    // Send lid status
    String lidStatus = (distance <= 15) ? "Open" : "Closed";
    Blynk.virtualWrite(V_LID_STATUS, lidStatus);

    // Send trash count
    Blynk.virtualWrite(V_TRASH_COUNT, trashCount);
  }
}

// Manual control via Blynk button
BLYNK_WRITE(V_MANUAL_CONTROL) {
  int buttonState = param.asInt(); // Read button state (0 or 1)
  if (buttonState == 1) {
    isManualOpen = true;  // Enable manual mode
    openLid();           // Open lid manually
    isManualOpen = false; // Return to auto mode after operation
  }
}

// Toggle sending metrics
BLYNK_WRITE(V_SEND_METRICS) {
  sendMetrics = param.asInt(); // Read switch state (0 or 1)
  if (!sendMetrics) {
    Serial.println("Metrics sending disabled.");
  } else {
    Serial.println("Metrics sending enabled.");
  }
}

void loop() {
  Blynk.run();
  timer.run();
}