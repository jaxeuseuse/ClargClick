let clicks = 0;
let startTime;
let isPlaying = false;
let intervalId;
let timeSelect;

document.addEventListener("DOMContentLoaded", () => {
    // Time button event listeners
    document.querySelectorAll(".time-button").forEach(button => {
        button.addEventListener("click", function() {
            if (isPlaying) {
                showPopup("Error: You cannot change the time during an active game.", "error-popup");
                return;
            }
            const time = button.getAttribute("data-time");
            if (time) {
                setTime(parseFloat(time));
            } else if (button.hasAttribute("custom-time")) {
                setCustomTime();
            }
        });
    });

    document.getElementById("clarg").addEventListener("click", clickHandler);

    // Other initialization code can go here if needed
});

// Sets the selected game duration
function setTime(seconds) {
    timeSelect = seconds;
}

// Custom time prompt logic
function setCustomTime() {
    const customTime = prompt("Enter custom time in seconds:");

    // Handle the case where the user clicks "Cancel"
    if (customTime === null || customTime.trim() === "") {
        closePopup();
        return;
    }

    const parsedTime = parseFloat(customTime);

    // Validate the parsed time
    if (!Number.isNaN(parsedTime) && parsedTime > 1) {
        timeSelect = parsedTime;
        showPopup(`Custom time set to ${parsedTime} seconds`);
    } else {
        showPopup("Please input a valid number 1 or above", "error-popup");
    }
}

// Resets the game state
function resetGame() {
    clicks = 0;
    clearInterval(intervalId);
    isPlaying = false;
    document.getElementById("clicks").innerHTML = clicks;
    document.getElementById("elapsed-time").innerHTML = "0";
    document.getElementById("cps").innerHTML = "0";
}

// Starts the game timer and tracks clicks
function startGame() {
    if (timeSelect === undefined) {
        showPopup("Please select a time duration first.", "error-popup");
        return;
    }
    clicks = 0;
    cps = 0;
    startTime = Date.now();
    isPlaying = true;
    document.getElementById("clicks").innerHTML = clicks;
    intervalId = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        document.getElementById("elapsed-time").innerHTML = elapsed.toFixed(1);
        CPS();
        if (elapsed >= timeSelect - 0.05) {
            clearInterval(intervalId);
            isPlaying = false;
            const cps = document.getElementById("cps").innerHTML;
            gameOver(cps, timeSelect); // Automatically submit the score
        }
    }, 100); // Update every 100 milliseconds
}

// Handles click events on the Clarg
function clickHandler() {
    if (!isPlaying) {
        startGame();
    }
    if (isPlaying) {
        clicks++;
        const clargSrc = document.getElementById("clarg").src;
        if (clargSrc.includes("dr_clarg")) {
            clicks = applyDrClargBoost(clicks);
        }
        else if (clargSrc.includes("buisness_clarg")) {
            clicks = applyBuisnessClargBoost(clicks);
        }
        else if (clargSrc.includes("vacation_clarg")) {
            clicks = applyVacationClargBoost(clicks);
        }
        else if (clargSrc.includes("secret_clarg")) {
            clicks = applySecretClargBoost(clicks);
        }
        document.getElementById("clicks").innerHTML = clicks;
        CPS();
    }
}

function CPS() {
    const elapsed = (Date.now() - startTime) / 1000;
    const cps = clicks / elapsed;
    if (elapsed > 0) {
        document.getElementById("cps").innerHTML = cps.toFixed(2);
    } else {
        document.getElementById("cps").innerHTML = "0";
    }
}

// Shows the specified popup with a message
function showPopup(message, popupId) {
    const popup = document.getElementById(popupId);
    popup.querySelector(".popup-message").innerHTML = message;
    popup.style.display = "flex";
}

// Closes the specified popup
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = "none";
    if (popupId === "game-popup") {
        resetGame();
        location.reload();
    }
}

function leaderPopup() {
    closePopup('game-popup');
    document.getElementById('leader-popup').style.display = 'flex';
}

function applyDrClargBoost(clicks) {
    if (Math.random() < 0.02) {
        return clicks * 2;
    }
    return clicks;
}

function applyBuisnessClargBoost(clicks) {
    if (Math.random() < 0.05) {
        return clicks * 3;
    }
    return clicks;
}

function applyVacationClargBoost(time) {
    if (Math.random() < 0.01) {
        return clicks * 8;
    }
    return clicks;
}

function applySecretClargBoost(clicks) {
    if (Math.random() < 0.02) {
        return clicks + 1200;
    }
    return clicks;
}

function gameOver(cps, elapsedTime) {
    // Submit the score to the server
    fetch("/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cps,
                clicks,
                elapsed_time: elapsedTime
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Score submitted successfully!") {
                showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Score submitted successfully!`, "game-popup");
            } else if (data.message === "Score updated successfully!") {
                showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Score updated successfully!`, "game-popup");
            } else if (data.message === "Score not higher than existing score.") {
                showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Score was not higher than existing score.`, "game-popup");
            } else if (data.message === "Guest scores are not recorded.") {
                showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Guest scores are not recorded.`, "game-popup");
            } else {
                showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Error submitting score.`, "game-popup");
            }

        })
        .catch(error => {
            console.error("Error:", error);
            showPopup(`Time's up! You clicked ${clicks} times in ${elapsedTime} seconds with a CPS of ${cps}. Error submitting score.`, "game-popup");
        });
}
