// host.ino
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <map>

// ----- CONFIG -----
const char* ssid = "Galaxy A12 DD2C";
const char* password = "tbln8293";


const uint16_t WS_PORT = 81;
WebSocketsServer webSocket(WS_PORT);
WebServer server(80);

// ----- AUTOMATION CONFIG -----
const float MAX_TEMP = 30.0;     // Beispiel Max-Wert
const float MAX_LICHT = 2800.0;   // Beispiel Max-Wert

const float MIN_TEMP = 20.0;     // Beispiel Min-Wert
const float MIN_LICHT = 2500.0;   // Beispiel Min-Wert

const unsigned long POSITION_COOLDOWN = 30000; // 30 Sekunden
unsigned long lastAutoMove = 0;

bool down = false;

// -------------TeilWerte----------------
const float viertel1_Temp = 25.0;
const float viertel1_Licht = 2500;
bool viertel1 = false;

const float viertel2_Temp = 26.5;
const float viertel2_Licht = 2650;
bool viertel2 = false;

const float viertel3_Temp = 28.0;
const float viertel3_Licht = 2800;
bool viertel3 = false;

const float viertel4_Temp = 30.0;
const float viertel4_Licht = 3000;
bool viertel4 = false;
// store last values per remote id (simple map using key/value strings)
struct SensorVals { 
  float temp; 
  float licht; 
  unsigned long lastSeen; 
};

struct ClientInfo {
  String id;
  String role;
};

std::map<uint8_t, ClientInfo> clients;

// We'll store up to 8 remotes keyed by string id. Keep it simple with arrays.
const int MAX_REMOTES = 8;
String remoteIds[MAX_REMOTES];
SensorVals remoteVals[MAX_REMOTES];
int remoteConnId[MAX_REMOTES]; // connection ID for webSocket (or -1)

void setDown(bool v1, bool v2, bool v3, bool v4){
  viertel1 = v1;
  viertel2 = v2;
  viertel3 = v3;
  viertel4 = v4;
}

void autoPullDown(float temp, float light) {
  bool range1 = viertel1_Temp < temp && viertel2_Temp > temp || viertel1_Licht < light && viertel2_Licht > light;
  bool range2 = viertel2_Temp < temp && viertel3_Temp > temp || viertel2_Licht < light && viertel3_Licht > light;
  bool range3 = viertel3_Temp < temp && viertel4_Temp > temp || viertel3_Licht < light && viertel4_Licht > light;
  bool range4 = viertel4_Temp < temp || viertel4_Licht < light;
  if(range1){
    setPos(25, 25);
    setDown(true, false, false, false);
  } else if(range2){
    setPos(50, 50);
    setDown(false, true, false, false);
  } else if(range3){
    setPos(75, 75);
    setDown(false, false, true, false);
  } else if(range4){
    setPos(100, 100);
    setDown(false, false, false, true);
  } else {
    setPos(0, 0);
    setDown(false, false, false, false);
  }
}

void setPos(int posH, int posA){
  // Cooldown prüfen
    if (millis() - lastAutoMove < POSITION_COOLDOWN) {
      return;
    }

    lastAutoMove = millis();

    StaticJsonDocument<256> out;
    out["type"] = "position";
    out["height"] = posH;
    out["angle"] = posA;

    String outStr;
    serializeJson(out, outStr);

    for (auto &c : clients) {
      if (c.second.role == "output" || c.second.role == "frontend") {
        webSocket.sendTXT(c.first, outStr);
      }
    }
    down = true;
    Serial.println("AutoMove triggered → height=100 angle=100");
}

void saveRemote(String id, float temp, float licht, uint8_t connId) {
  for (int i=0;i<MAX_REMOTES;i++){
    if (remoteIds[i] == id) {
      remoteVals[i].temp = temp;
      remoteVals[i].licht = licht;
      remoteVals[i].lastSeen = millis();
      remoteConnId[i] = connId;
      return;
    }
  }
  for (int i=0;i<MAX_REMOTES;i++){
    if (remoteIds[i].length()==0) {
      remoteIds[i] = id;
      remoteVals[i].temp = temp;
      remoteVals[i].licht = licht;
      remoteVals[i].lastSeen = millis();
      remoteConnId[i] = connId;
      return;
    }
  }
}

int getConnIdForTarget(String target) {
  // target is like "output1" or an id string stored in remoteIds
  for (int i=0;i<MAX_REMOTES;i++){
    if (remoteIds[i] == target) return remoteConnId[i];
  }
  return -1;
}

// WebSocket event
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    IPAddress ip = webSocket.remoteIP(num);
    Serial.printf("Client connected: ID=%u, IP=%s\n", num, ip.toString().c_str());
  } else if (type == WStype_DISCONNECTED) {
    Serial.printf("Client disconnected: ID=%u\n", num);
    // clear any remoteConnId entries matching this conn
    for(int i=0;i<MAX_REMOTES;i++) 
      if(remoteConnId[i]==num) 
        remoteConnId[i]=-1;
  } else if (type == WStype_TEXT) {
    String msg = String((char*)payload);

    Serial.println("WS recv: " + msg);

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, msg);

    if(err){ 
      Serial.println("JSON parse err"); 
      return; 
    }

    String t = doc["type"];
    Serial.println("Type: " + t);
    if(t == "sensor"){
      String id = doc["id"];
      float temp = doc["temp"]; 
      float licht = doc["licht"];

      saveRemote(id, temp, licht, num);

      // send update to all browser clients
      StaticJsonDocument<256> out;

      out["type"] = "update"; 
      out["remote"] = id; 
      out["temp"] = temp; 
      out["licht"] = licht;

      String outStr; 
      serializeJson(out, outStr);
      webSocket.broadcastTXT(outStr);

      checkAndAutoMove();
    } else if (t == "command"){
      Serial.println("Command");
      // forward to target remote
      String target = doc["target"];
      int conn = getConnIdForTarget(target);

      if(conn >= 0) {
        webSocket.sendTXT(conn, msg);
        Serial.println("Forwarded command to conn " + String(conn));
      } else {
        Serial.println("Target not found: " + target);
      }
    } else if (t == "hello") {
      Serial.println("Got the Hello");
      Serial.println("Role: " + doc["role"].as<String>());
      clients[num].id = doc["id"].as<String>();
      clients[num].role = doc["role"].as<String>();

      // ACK senden
      webSocket.sendTXT(num, "{\"type\":\"ack\",\"status\":\"ok\"}");
      Serial.println("send the ack");
    } else if (doc["type"] == "position") {
      int heightVal = doc["height"];
      int angleVal = doc["angle"];

      StaticJsonDocument<256> out;

      out["type"] = "position";  
      out["height"] = heightVal; 
      out["angle"] = angleVal;

      String outStr; 
      serializeJson(out, outStr);

      for (auto &c : clients) {
        if (c.second.role == "output") {
          webSocket.sendTXT(c.first, outStr);
        }
      }

      Serial.printf("Pos: H=%d A=%d", heightVal, angleVal);
    } else {
      Serial.println("Kein Richtiger Type: " + t);
    }

  }
}

bool computeAverages(float &avgTemp, float &avgLicht) {
  float sumTemp = 0;
  float sumLicht = 0;
  int count = 0;

  for (int i = 0; i < MAX_REMOTES; i++) {
    if (remoteIds[i].length() > 0 && remoteConnId[i] >= 0) {
      sumTemp += remoteVals[i].temp;
      sumLicht += remoteVals[i].licht;
      count++;
    }
  }

  if (count == 0) return false;

  avgTemp = sumTemp / count;
  avgLicht = sumLicht / count;
  return true;
}

void checkAndAutoMove() {
  float avgTemp, avgLicht;

  if (!computeAverages(avgTemp, avgLicht)) return;

  autoPullDown(avgTemp, avgLicht);
  // Max-Wert überschritten?
}


void setup(){
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

  server.serveStatic("/", LittleFS, "/");

  server.begin();


  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  for(int i=0;i<MAX_REMOTES;i++){ 
    remoteIds[i]=""; 
    remoteConnId[i] = -1; 
  }

  Serial.println("Host ready");
}

void loop(){
  webSocket.loop();
  server.handleClient();
}