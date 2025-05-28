#include <Wire.h>
#include <ESP32Servo.h>  // Library for controlling the servo motor on ESP32

// Define pins for the ultrasonic sensor
#define ECHO_PIN 13  // Echo pin connected to GPIO13
#define TRIG_PIN 27  // Trig pin connected to GPIO12

// Define pin for servo motor
#define SERVO_PIN 14  // Servo connected to GPIO14

// Variables to store measurement
long duration;
int distance;

// Create Servo object
Servo myServo;

// Setup function
void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Attach servo to its pin
  myServo.attach(SERVO_PIN);

  // Move servo to initial position (closed)
  myServo.write(0);
}

// Function to measure distance
int measureDistance() {
  // Trigger the ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure the duration of the echo pulse
  duration = pulseIn(ECHO_PIN, HIGH);

  // Calculate distance in cm (sound speed = 343 m/s)
  return duration / 58.2;
}

// Main loop
void loop() {
  distance = measureDistance();

  // Display the distance
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Check distance and control servo
  if (distance > 0 && distance <= 15) {  // If an object is detected within 15 cm
    myServo.write(90);  // Open lid (servo moves to 90 degrees)
    delay(2000);        // Keep lid open for 2 seconds
  } else {
    myServo.write(0);   // Close lid (servo moves back to 0 degrees)
  }

  // Delay between readings
  delay(1000);
}