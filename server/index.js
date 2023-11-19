const mqtt = require("mqtt");

var mqttClient;

const mqttHost = "127.0.0.1";
const protocol = "mqtt";
const port = "1883";

const connectToBroker = () => {
    const clientId = "client" + Math.random().toString(36).substring(7);

    const hostURL = `${protocol}://${mqttHost}:${port}`;

    const options = {
        keepalive: 60,
        clientId: clientId,
        protocolId: "MQTT",
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
    };

    mqttClient = mqtt.connect(hostURL, options);

    mqttClient.on("error", (err) => {
        console.log("Error: ", err);
        mqttClient.end();
    });

    mqttClient.on("reconnect", () => {
        console.log("Reconnecting...");
    });

    mqttClient.on("connect", () => {
        console.log("Client connected:" + clientId);

        mqttClient.subscribe("weather");
        mqttClient.subscribe("temperature");
        mqttClient.subscribe("wind");
        mqttClient.subscribe("humidity");
    });

    // Received Message
    mqttClient.on("message", (topic, message) => {
        const topics = {
            weather: onWeatherReport,
            temperature: onTemperatureReport,
            wind: onWindReport,
            humidity: onHumidityReport,
        }

        topics[topic](message);
    });
}

const onWeatherReport = (value) => {
    console.log(`Clima: ${value}`);
}

const onTemperatureReport = (value) => {
    console.log(`Temperatura: ${value} °C`);
}

const onWindReport = (value) => {
    console.log(`Velocidade do Vento: ${value} km/h`);
}

const onHumidityReport = (value) => {
    console.log(`Umidade: ${value}%`);
}

connectToBroker();
