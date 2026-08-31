// remote_sensor.ino
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// remote_sensor.ino
const char* ssid = "Galaxy A12 DD2C";
const char* password = "tbln8293";

const char* HOST_IP = "10.108.132.235";  // IP des Host-ESP32 (anpassen)
const uint16_t HOST_PORT = 81;


#define REMOTE_ID "remote3"  // <-- anpassen für remote1/remote2/remote3


WebSocketsClient webSocket;
unsigned long lastSend = 0;


// Sensor pins
const int thermistorPin = 34;
const int photoPin = 35;


void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) Serial.println("WS connected to host");
  if (type == WStype_DISCONNECTED) Serial.println("WS disconnected");
  if (type == WStype_TEXT) {
    Serial.printf("From host: %s\n", payload);
    // host may send commands
  }
}


float readTempC() {
  int raw = analogRead(thermistorPin);
  float voltage = raw * (3.3 / 4095.0);
  // same conversion as your previous function (NTC)
  float R1 = 10000.0;
  float B = 3950.0;
  float T0 = 298.15;
  float Rth = R1 * (3.3 / voltage - 1.0);
  float tempK = 1.0 / (1.0 / T0 + (1.0 / B) * log(Rth / R1));
  return tempK - 273.15;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(200);
  Serial.println("WiFi connected");


  webSocket.begin(HOST_IP, HOST_PORT, "/");
  webSocket.onEvent(webSocketEvent);
}


void loop() {
  webSocket.loop();
  unsigned long now = millis();
  if (now - lastSend > 2000) {
    float t = readTempC();
    int lightRaw = analogRead(photoPin);
    StaticJsonDocument<200> doc;
    doc["type"] = "sensor";
    doc["id"] = REMOTE_ID;
    doc["temp"] = t;
    doc["licht"] = lightRaw;
    String out;
    serializeJson(doc, out);
    webSocket.sendTXT(out);
    Serial.println(out);
    lastSend = now;
  }
}