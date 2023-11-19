const mqtt = require("mqtt");
const axios = require("axios");

var mqttClient;

const mqttHost = "mqtt.tago.io";
const protocol = "mqtt";
const port = "1883";
const password = "6fed5d67-ad90-4792-aed9-9bc0a33be0dc";
const username = "Token";

const apiKey = "778bf8ed4aa8e503747cce5a4668ee7d";
const city = encodeURIComponent("Bento Gonçalves");
const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;

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
            const weatherDescription = response.data?.weather?.[0]?.description;

            // Caso não consiga obter o clima, não envia
            if (!weatherDescription) {
                return;
            }

            // Deixa a primeira letra de cada palavra maiusculo
            const message = weatherDescription.replace(/^\w|\s\w/g, (letter) => letter.toUpperCase());

            process.stdout.cursorTo(0, lastLine++);
            process.stdout.write(`${getLogData()} - Enviando clima: ${message}\n`);

            mqttClient.publish("weather", message);
        })
        .catch((error) => {
            process.stdout.cursorTo(0, lastLine++);
            process.stdout.write(`${getLogData()} - Erro ao obter clima: ${error}\n`);
            console.log("Erro ao obter clima: ", error);
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
