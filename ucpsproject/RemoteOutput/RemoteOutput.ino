#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

// ----- CONFIG -----
const char* ssid = "Galaxy A12 DD2C";
const char* password = "tbln8293";


const char* HOST_IP = "10.108.132.235";
const uint16_t HOST_WS_PORT = 81;


WebServer server(80);
WebSocketsClient webSocket;


volatile int heightVal = 0;
volatile int angleVal  = 0;

void wsEvent(WStype_t type, uint8_t * payload, size_t length) {

  switch (type) {

    case WStype_CONNECTED: {
      Serial.println("WS connected to host");

      // >>> HELLO / IDENTIFIKATION <<<
      StaticJsonDocument<128> hello;
      hello["type"] = "hello";
      hello["role"] = "output";
      hello["id"]   = "output1";   // <-- DEINE Output-ID

      String msg;
      serializeJson(hello, msg);
      webSocket.sendTXT(msg);
      break;
    }

    case WStype_DISCONNECTED:
      Serial.println("WS disconnected");
      break;

    case WStype_TEXT: {
      StaticJsonDocument<128> doc;
      DeserializationError err = deserializeJson(doc, payload);
      if (err) return;

      const String msgType = doc["type"];
      if (!msgType) return;
      
      // >>> STEUERDATEN VOM HOST <<<
      if (msgType == "position") {
        heightVal = doc["height"];
        angleVal  = doc["angle"];
        Serial.printf("Pos: H=%d A=%d\n", heightVal, angleVal);
      }
      break;
    }

    default:
      Serial.println(type);
      break;
  }
}


void setup() {
Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while(WiFi.status() != WL_CONNECTED){ 
    delay(500); Serial.print('.'); 
  }
  Serial.println();
  Serial.println("IP: " + WiFi.localIP().toString());

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS failed");
    return;
  }

  server.on("/", HTTP_GET, []() {
    File f = LittleFS.open("/index.html", "r");
    server.streamFile(f, "text/html");
    f.close();
  });
  
  server.on("/state", HTTP_GET, []() {
    StaticJsonDocument<128> doc;
    doc["height"] = heightVal;
    doc["angle"]  = angleVal;

    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });


  server.serveStatic("/", LittleFS, "/");

  server.begin();

  Serial.println("Output ready");

  webSocket.begin(HOST_IP, HOST_WS_PORT, "/");
  webSocket.onEvent(wsEvent);
}

void loop() {
  webSocket.loop();
  server.handleClient();
}
