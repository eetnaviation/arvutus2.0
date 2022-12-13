let firstNumber;
let secondNumber;
let correctAnswerValue;
let responseMessage;
let secondMaxTotal;
let operator = "+";
let maxTotal = 10;
let pointLimitPercentage = 0.8;
let serverPort = 3000;
let points = 0;
let currentLevel = 1;
let highScore;
//Interval's
let levelInterval = 40000;
let gameEndTimer = 240000;
let gameRunning = 0;
//IntervalID
let setLevelInterval;
let stopGameTimeout;
const express = require('express');
const { fstat } = require('fs');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

console.log("Loading index ID's...");

app.get('/', (req, res) => {
    //index.html
    gameRunning = 0;
    res.sendFile(__dirname + '/client/index.html');
    clearUserData();
});

app.get('/liitmine', (req, res) => {
    //Set correctAnswerValue to use the correct operator and send to arvutus.html
    operator = "+";
    res.sendFile(__dirname + '/client/arvutus.html');
    gameRunning = 1;
});

app.get('/lahutamine', (req, res) => {
    //Set correctAnswerValue to use the correct operator and send to arvutus.html
    operator = "-";
    res.sendFile(__dirname + '/client/arvutus.html');
    gameRunning = 1;
});

app.get('/client/icons/logo', (req, res) => {
    //Send the logo file
    res.sendFile(__dirname + '/client/icons/logo.png');
})

app.get('/client/icons/favicon', (req, res) => {
    //Send the logo file
    res.sendFile(__dirname + '/client/icons/favicon.png');
})

console.log("Apache init complete");

server.listen(serverPort, () => {
    console.log("Apache server initalized...");
    console.log('Server started on port', serverPort);
});

io.on('connection', (socket) => {
    //Only start math if user is on the correct page (gameRunning = 1)
    if (gameRunning == 1) {
        getNewCalculation();
        console.log(correctAnswerValue);
        io.emit('calculation', { firstNumber: firstNumber, secondNumber: secondNumber, calculationType: operator});
        
        //Answers the answer for the calculation
        socket.on('answer', (msg) => {
            if (msg == correctAnswerValue) {
                calculatePoints(true);
                responseMessage = "Correct answer! You currently have " + points + " points. Current level: " + currentLevel;
            }
            else {
                calculatePoints(false);
                responseMessage = "Incorrect answer! You currently have " + points + " points. Current level: " + currentLevel;
            }
            io.emit('answerCheck', { answerType: responseMessage});
            getNewCalculation();
            io.emit('calculation', { firstNumber: firstNumber, secondNumber: secondNumber, calculationType: operator});
        });
        //Answers the request for high score
        socket.on('requestHighScore', (msg) => {
            sendHighScore();
        })
        setLevelInterval = setInterval(setLevel, levelInterval);
        stopGameTimeout = setTimeout(stopGame, gameEndTimer);
    }
});

function getNewCalculation() {
    //Generates correct answer with the correct operator
    if (operator == "+") {
        if (currentLevel == 1 || currentLevel == 2) {
            firstNumber = Math.floor(Math.random() * maxTotal);
            secondMaxTotal = maxTotal - firstNumber;
            secondNumber = Math.floor(Math.random() * secondMaxTotal);
        }
        //Needed for eliminating the calculations from the previous levels
        else if (currentLevel > 2) {
            firstNumber = Math.floor(Math.random() * (maxTotal - (maxTotal * 0.1)) + (maxTotal * 0.1));
            secondMaxTotal = maxTotal - firstNumber;
            secondNumber = Math.floor(Math.random() * (secondMaxTotal - (secondMaxTotal * 0.1)) + (secondMaxTotal * 0.1));
        } //TODO: fix secondMaxRandom being too low (777 - 23)
        correctAnswerValue = firstNumber + secondNumber;
    }
    else if (operator == "-") {
        if (currentLevel == 1 || currentLevel == 2) {
            firstNumber = Math.floor(Math.random() * maxTotal);
            secondNumber = Math.floor(Math.random() * firstNumber);
        }
        //Needed for eliminating the calculations from the previous levels
        else if (currentLevel > 2) {
            firstNumber = Math.floor(Math.random() * (maxTotal - (maxTotal * 0.1)) + (maxTotal * 0.1));
            secondNumber = Math.floor(Math.random() * (firstNumber - (maxTotal * 0.1)) + (maxTotal * 0.1));
        }
        correctAnswerValue = firstNumber - secondNumber;
    }
}

function calculatePoints(correct) {
    //Calculate points (correct = true means that answer was correct and vice versa)
    if (correct == true) {
        if (firstNumber <= maxTotal * 0.1 || secondNumber <= maxTotal * 0.1 ) {
            points += 2;
        }
        else if (correctAnswerValue <= maxTotal * pointLimitPercentage) {
            points += 4;
        }
        else {
            points += 7;
        }
    }
    else {
        points -= 5;
    }
}

function sendErrorInfo(data) {
    //Unused (Error messages)
    io.emit('errorResponse', "ERROR: ", data);
}

function setLevel() {
    //Constantly updates/sets level
    currentLevel += 1;
    switch (currentLevel) {
        case 2:
            maxTotal = 20;
            break;
        case 3:
            maxTotal = 100;
            break;
        case 4:
            maxTotal = 1000;
            break;
        case 5:
            maxTotal = 10000;
            break;
        case 6:
            maxTotal = 100000;
            break;
        default:
            maxTotal = 10;
            currentLevel = 1;
            break;
    }
}

function stopGame() {
    //Ends/Stops the game
    writeHighScore(points);
    gameRunning = 0;
    clearInterval(setLevelInterval);
    io.emit('gameEndMessage', { points: points, currentLevel: currentLevel });
}

function clearUserData() {
    //Used to clear user data variables
    points = 0;
    currentLevel = 1;
    gameRunning = 0;
    setLevelInterval = 0;
    stopGameTimeout = 0;
}

// DATABASE FUNCTIONS

function writeHighScore(score) {
    //Write highscore to be stored
    highScore = score;
}

function sendHighScore() {
    io.emit('highScore', highScore);
}