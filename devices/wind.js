const mqtt = require("mqtt");
const axios = require("axios");

var mqttClient;

const mqttHost = "mqtt.tago.io";
const protocol = "mqtt";
const port = "1883";
const password = "620e8051-46a3-4bad-a408-03ac941a9044";
const username = "Token";

const apiKey = "778bf8ed4aa8e503747cce5a4668ee7d";
const city = encodeURIComponent("Bento Gonçalves");
const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

let lastLine = 3;

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
        username: username,
        password: password,
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

        setTimeout(() => {
            initMessageSender(minutesToMilliseconds(10));
        }, 5000)
    });
};

const publishMessage = () => {
    process.stdout.cursorTo(0, 2);
    process.stdout.write('Resultados: ');

    axios.get(url)
        .then((response) => {
            const windSpeed = response.data.wind.speed;

            // Se velocidade do vento for > 10 ou < 0, não envia pois provavelmente está incorreto.
            if (!windSpeed || windSpeed > 10 || windSpeed < 0) {
                return;
            }

            const message = windSpeed.toString();

            process.stdout.cursorTo(0, lastLine++);
            process.stdout.write(`${getLogData()} - Enviando velocidade do vento: ${message}\n`);

            mqttClient.publish("wind", message);
        })
        .catch((error) => {
            process.stdout.cursorTo(0, lastLine++);
            process.stdout.write(`${getLogData()} - Erro ao obter velocidade do vento: ${error}\n`);
        });
};

const initMessageSender = (length) => {
    let time = 0;
    process.stdout.write('\x1bc');

    setInterval(() => {
        time += 100;

        const progress = Math.floor((time / length) * 100);

        let progressBar = "[";

        for (let i = 1; i <= 100; i++) {
            if (i <= progress) {
                progressBar += "#";
                continue;
            }

            progressBar += " ";
        }

        progressBar += "]";

        process.stdout.cursorTo(0, 0);
        process.stdout.clearLine();
        process.stdout.write(progressBar + ` Progresso: ${progress}%`);

        if (progress === 100) {
            publishMessage();
            time = 0;
        }
    }, 100);
};

const minutesToMilliseconds = (minutes) => {
    return minutes * 60 * 1000;
};

const getLogData = () => {
    return (new Date()).toLocaleString('pt-BR')
}

connectToBroker();
