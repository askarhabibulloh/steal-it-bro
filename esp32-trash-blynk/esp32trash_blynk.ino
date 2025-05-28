//Kode ini hanya untuk metrics
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
#define V_DISTANCE V0  // Display distance
#define V_LID_STATUS V1  // Lid status: open/closed
#define V_TRASH_COUNT V2  // Trash count

Servo myServo;
#define ECHO_PIN 13
#define TRIG_PIN 27
#define SERVO_PIN 14

long duration;
int distance;
int trashCount = 0;

BlynkTimer timer;

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, pass);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  myServo.attach(SERVO_PIN);
  myServo.write(0);  // Lid closed

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

void sendDataToBlynk() {
  distance = measureDistance();

  // Send distance to Blynk
  Blynk.virtualWrite(V_DISTANCE, distance);

  // Check if lid is open
  String lidStatus = (distance <= 15) ? "Open" : "Closed";
  Blynk.virtualWrite(V_LID_STATUS, lidStatus);

  // Update trash count
  if (distance <= 15) {
    trashCount++;
    Blynk.virtualWrite(V_TRASH_COUNT, trashCount);
    delay(2000);  // Debounce to avoid multiple counts
  }
}

void loop() {
  Blynk.run();
  timer.run();
}