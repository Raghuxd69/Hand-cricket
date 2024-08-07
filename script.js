import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, update, onValue, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjpFuQ0Mg9KnthmToMXMw_c0tXIBY2rKo",
    authDomain: "mycrick88497.firebaseapp.com",
    databaseURL: "https://mycrick88497-default-rtdb.firebaseio.com",
    projectId: "mycrick88497",
    storageBucket: "mycrick88497.appspot.com",
    messagingSenderId: "731647894608",
    appId: "1:731647894608:web:3a9267b6b77074a95f9d55",
    measurementId: "G-RDSDMX8ZZ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentRoom = null;
let isPlayer1 = false;
let isSecondInnings = false;
let isComputer = false;

window.createRoom = function () {
    const room = document.getElementById('roomInput').value;
    const roomRef = ref(database, `rooms/${room}`);

    set(roomRef, {
        player1: serverTimestamp(),
        player2: null,
        player1Score: 0,
        player2Score: 0,
        target: null
    }).then(() => {
        currentRoom = room;
        isPlayer1 = true;
        document.getElementById('game').innerText = `Room ${room} created. Waiting for another player...`;
    });
}

window.joinRoom = function () {
    const room = document.getElementById('roomInput').value;
    const roomRef = ref(database, `rooms/${room}`);

    get(roomRef).then(snapshot => {
        if (snapshot.exists() && !snapshot.val().player2) {
            update(roomRef, { player2: serverTimestamp() }).then(() => {
                currentRoom = room;
                document.getElementById('game').innerText = `Joined room ${room}. Waiting for the game to start...`;
            });
        } else {
            document.getElementById('game').innerText = `Room ${room} is not available or already has two players.`;
        }
    });
}

window.playWithComputer = function () {
    currentRoom = 'computer';
    isPlayer1 = true;
    isComputer = true;
    document.getElementById('game').innerText = 'Playing against the computer. You bat first.';
    document.getElementById('turnInput').style.display = 'block';
}

window.playTurn = function () {
    const run = parseInt(document.getElementById('runInput').value);
    if (run < 1 || run > 6) {
        alert('Enter a valid run between 1 and 6');
        return;
    }
    const out = Math.random() < 0.1; // 10% chance of getting out, you can adjust this logic

    if (isComputer) {
        playTurnWithComputer(run, out);
    } else {
        playTurnWithPlayer(run, out);
    }
}

function playTurnWithPlayer(run, out) {
    const roomRef = ref(database, `rooms/${currentRoom}`);

    get(roomRef).then(snapshot => {
        const data = snapshot.val();
        if (!data) return;

        if (data.target === null) { // First innings
            if (isPlayer1) {
                update(roomRef, {
                    player1Score: data.player1Score + run
                }).then(() => {
                    if (out) {
                        update(roomRef, { target: data.player1Score + 1 });
                        document.getElementById('game').innerText += `\nInnings over! Target for Player 2: ${data.player1Score + 1}`;
                        isSecondInnings = true;
                    } else {
                        document.getElementById('game').innerText += `\nPlayer 1 played ${run}, total score: ${data.player1Score + run}`;
                    }
                });
            }
        } else { // Second innings
            if (!isPlayer1) {
                update(roomRef, {
                    player2Score: data.player2Score + run
                }).then(() => {
                    if (out || data.player2Score + run >= data.target) {
                        const winner = data.player2Score + run >= data.target ? 'Player 2' : 'Player 1';
                        document.getElementById('game').innerText += `\nGame over! Winner: ${winner}`;
                        document.getElementById('turnInput').style.display = 'none';
                    } else {
                        document.getElementById('game').innerText += `\nPlayer 2 played ${run}, total score: ${data.player2Score + run}`;
                    }
                });
            }
        }
    });
}

function playTurnWithComputer(run, out) {
    const computerRun = Math.floor(Math.random() * 6) + 1; // Computer randomly chooses a run between 1 and 6
    let data = JSON.parse(localStorage.getItem('computerGameData')) || { player1Score: 0, player2Score: 0, target: null };

    if (data.target === null) { // First innings
        data.player1Score += run;
        if (out) {
            data.target = data.player1Score + 1;
            document.getElementById('game').innerText += `\nYou are out! Target for Computer: ${data.target}`;
            isSecondInnings = true;
        } else {
            document.getElementById('game').innerText += `\nYou played ${run}, total score: ${data.player1Score}`;
        }
    } else { // Second innings
        data.player2Score += computerRun;
        if (out || data.player2Score >= data.target) {
            const winner = data.player2Score >= data.target ? 'Computer' : 'You';
            document.getElementById('game').innerText += `\nComputer played ${computerRun}. Game over! Winner: ${winner}`;
            document.getElementById('turnInput').style.display = 'none';
            localStorage.removeItem('computerGameData');
            return;
        } else {
            document.getElementById('game').innerText += `\nComputer played ${computerRun}, total score: ${data.player2Score}`;
        }
    }

    localStorage.setItem('computerGameData', JSON.stringify(data));
}

onValue(ref(database, 'rooms'), snapshot => {
    snapshot.forEach(roomSnapshot => {
        const room = roomSnapshot.key;
        const data = roomSnapshot.val();
        if (data.player2 !== null && currentRoom === room) {
            document.getElementById('game').innerText = `Game started in room ${room}`;
            document.getElementById('turnInput').style.display = 'block';
        }
    });
});
