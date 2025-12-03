import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDWVBJ4YuB33ya5r0BDKV-d6nG-n_a58IU",
    authDomain: "nbjhmathteam.firebaseapp.com",
    projectId: "nbjhmathteam",
    storageBucket: "nbjhmathteam.firebasestorage.app",
    messagingSenderId: "735558400428",
    appId: "1:735558400428:web:4971329581fa9f0d256209",
    measurementId: "G-VJ0VFMGKHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Username and Leaderboard System
    let currentUsername = null;

    // Firestore Communication with error handling
    async function saveUserScore(username, userData) {
        try {
            await setDoc(doc(db, "users", username), userData, { merge: true });
            console.log('Score saved successfully for', username);
        } catch (error) {
            console.error('Error saving game data:', error);
            alert('Failed to save score. Check console for details.');
        }
    }

    async function getUserData(username) {
        try {
            const docRef = doc(db, "users", username);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return {
                    totalScore: 0,
                    bestBatchScore: 0,
                    gamesPlayed: 0,
                    lastPlayed: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            return {
                totalScore: 0,
                bestBatchScore: 0,
                gamesPlayed: 0,
                lastPlayed: new Date().toISOString()
            };
        }
    }

    async function updateUserScore(username, batchScore, addToTotal) {
        try {
            let userData = await getUserData(username);

            userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
            userData.lastPlayed = new Date().toISOString();

            if (batchScore > (userData.bestBatchScore || 0)) {
                userData.bestBatchScore = batchScore;
            }

            if (addToTotal) {
                userData.totalScore = (userData.totalScore || 0) + batchScore;
            }

            await saveUserScore(username, userData);

            // Update local display
            updateUserStats();
        } catch (error) {
            console.error('Error updating user score:', error);
        }
    }

    // Real-time Leaderboard Listener with error handling
    function setupLeaderboardListener() {
        const usersRef = collection(db, "users");

        // Batch leaderboard
        const qBatch = query(usersRef, orderBy("bestBatchScore", "desc"), limit(10));

        onSnapshot(qBatch, (snapshot) => {
            const batchLeaderboard = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.bestBatchScore) {
                    batchLeaderboard.push({ username: doc.id, score: data.bestBatchScore });
                }
            });
            renderLeaderboard('batch-leaderboard', batchLeaderboard);
        }, (error) => {
            console.error('Error listening to batch leaderboard:', error);
            // Fallback: try to fetch once
            getDocs(qBatch).then(snapshot => {
                const batchLeaderboard = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.bestBatchScore) {
                        batchLeaderboard.push({ username: doc.id, score: data.bestBatchScore });
                    }
                });
                renderLeaderboard('batch-leaderboard', batchLeaderboard);
            });
        });

        // Total leaderboard
        const qTotal = query(usersRef, orderBy("totalScore", "desc"), limit(10));
        onSnapshot(qTotal, (snapshot) => {
            const totalLeaderboard = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.totalScore) {
                    totalLeaderboard.push({ username: doc.id, score: data.totalScore });
                }
            });
            renderLeaderboard('total-leaderboard', totalLeaderboard);
        }, (error) => {
            console.error('Error listening to total leaderboard:', error);
            // Fallback: try to fetch once
            getDocs(qTotal).then(snapshot => {
                const totalLeaderboard = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.totalScore) {
                        totalLeaderboard.push({ username: doc.id, score: data.totalScore });
                    }
                });
                renderLeaderboard('total-leaderboard', totalLeaderboard);
            });
        });
    }

    function renderLeaderboard(elementId, leaderboard) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        if (leaderboard.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No scores yet</p>';
            return;
        }

        // Take top 3
        leaderboard.slice(0, 3).forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item rank-${index + 1}`;

            const rank = document.createElement('span');
            rank.className = 'leaderboard-rank';
            rank.textContent = ['🥇', '🥈', '🥉'][index] || `#${index + 1}`;

            const name = document.createElement('span');
            name.className = 'leaderboard-name';
            name.textContent = entry.username;

            const score = document.createElement('span');
            score.className = 'leaderboard-score';
            score.textContent = entry.score || 0;

            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(score);
            container.appendChild(item);
        });
    }

    async function updateUserStats() {
        if (!currentUsername) return;

        const userData = await getUserData(currentUsername);
        const statsContainer = document.getElementById('user-stats-content');

        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Username:</span>
                <span class="stat-value">${currentUsername}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Games Played:</span>
                <span class="stat-value">${userData.gamesPlayed || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Best Batch:</span>
                <span class="stat-value">${userData.bestBatchScore || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Score:</span>
                <span class="stat-value">${userData.totalScore || 0}</span>
            </div>
        `;
    }

    // Username Modal Handling
    function showUsernameModal() {
        const modal = document.getElementById('username-modal');
        modal.classList.add('show');
        document.getElementById('username-input').focus();
    }

    function hideUsernameModal() {
        const modal = document.getElementById('username-modal');
        modal.classList.remove('show');
    }

    async function handleUsernameSubmit() {
        const input = document.getElementById('username-input');
        const username = input.value.trim();

        if (username.length < 2) {
            alert('Username must be at least 2 characters');
            return;
        }

        if (username.length > 20) {
            alert('Username must be 20 characters or less');
            return;
        }

        currentUsername = username;
        localStorage.setItem('amc8_username', username); // Persist locally for convenience

        // Ensure user exists in DB
        const userData = await getUserData(username);
        if (!userData.gamesPlayed) {
            await saveUserScore(username, {
                totalScore: 0,
                bestBatchScore: 0,
                gamesPlayed: 0,
                lastPlayed: new Date().toISOString()
            });
        }

        hideUsernameModal();
        updateUserStats();

        // Load user's total score
        totalScore = userData.totalScore || 0;
        updateScoreDisplay();
    }

    // Leaderboard Toggle
    document.getElementById('leaderboard-toggle').addEventListener('click', () => {
        const panel = document.getElementById('leaderboard-panel');
        panel.classList.toggle('hidden');
        updateUserStats();
    });

    document.getElementById('leaderboard-close').addEventListener('click', () => {
        document.getElementById('leaderboard-panel').classList.add('hidden');
    });

    // Username Submit
    document.getElementById('username-submit').addEventListener('click', handleUsernameSubmit);
    document.getElementById('username-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUsernameSubmit();
        }
    });

    // Game state variables - must be declared before use
    const problemImage = document.getElementById('problem-image');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const resultText = document.getElementById('result');
    const scoreText = document.getElementById('score');
    const nextProblemBtn = document.getElementById('next-problem');
    const restartGameBtn = document.getElementById('restart-game');
    const gameControls = document.getElementById('game-controls');

    let problems = [];
    let currentProblemIndex = 0;
    let gameProblems = [];
    let batchScore = 0;
    let totalScore = 0;
    let timerInterval;
    let seconds = 0;
    let streak = 0;

    // Check for existing user on load
    const savedUsername = localStorage.getItem('amc8_username');
    if (savedUsername) {
        currentUsername = savedUsername;
        updateUserStats();
        getUserData(currentUsername).then(data => {
            totalScore = data.totalScore || 0;
            updateScoreDisplay();
        });
    } else {
        showUsernameModal();
    }

    // Initialize Leaderboard Listener
    setupLeaderboardListener();

    // Sound effects using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(frequency, duration, type = 'sine', volume = 0.3) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playCorrectSound() {
        playSound(523.25, 0.1); // C5
        setTimeout(() => playSound(659.25, 0.1), 100); // E5
        setTimeout(() => playSound(783.99, 0.2), 200); // G5
    }

    function playIncorrectSound() {
        playSound(200, 0.3, 'sawtooth', 0.1);
    }

    function playStreakSound() {
        playSound(880, 0.1); // A5
        setTimeout(() => playSound(1046.5, 0.15), 100); // C6
    }

    function fireConfetti() {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });
        fire(0.2, {
            spread: 60,
        });
        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });
        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    function updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const percentage = ((currentProblemIndex + 1) / gameProblems.length) * 100;
        progressBar.style.width = percentage + '%';
        progressText.textContent = `${currentProblemIndex + 1}/${gameProblems.length}`;
    }

    function updateStreak(correct) {
        const streakContainer = document.getElementById('streak-container');
        const streakCount = document.getElementById('streak-count');

        if (correct) {
            streak++;
            if (streak >= 2) {
                streakContainer.style.display = 'flex';
                streakCount.textContent = streak;
                streakContainer.classList.remove('pulse');
                void streakContainer.offsetWidth; // Trigger reflow
                streakContainer.classList.add('pulse');
                if (streak >= 3) {
                    playStreakSound();
                }
            }
        } else {
            streak = 0;
            streakContainer.style.display = 'none';
        }
    }

    function getCelebratoryMessage(points, streak) {
        const messages = {
            3: ['🎉 Amazing!', '⚡ Lightning fast!', '🌟 Brilliant!', '🔥 On fire!', '💯 Perfect!'],
            1: ['✅ Correct!', '👍 Good job!', '✨ Nice!', '👏 Well done!', '🎯 Got it!']
        };

        const messageList = messages[points] || messages[1];
        let message = messageList[Math.floor(Math.random() * messageList.length)];

        if (streak >= 5) {
            message += ' 🔥🔥🔥 ' + streak + ' STREAK!';
        } else if (streak >= 3) {
            message += ' 🔥 ' + streak + ' streak!';
        }

        return message;
    }

    function startTimer() {
        seconds = 0;
        document.getElementById('timer').textContent = seconds;
        timerInterval = setInterval(() => {
            seconds++;
            document.getElementById('timer').textContent = seconds;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        seconds = 0;
        document.getElementById('timer').textContent = seconds;
    }

    const years = [1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025];
    const answerFiles = years.map(year => `amc8_answers_all_years/answers_${year}.txt`);

    async function loadProblems() {
        try {
            for (const answerFile of answerFiles) {
                const year = answerFile.split('/').pop().split('_')[1].split('.')[0];
                const response = await fetch(answerFile);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for file ${answerFile}`);
                }
                const text = await response.text();
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.trim() !== '') {
                        const parts = line.split(':');
                        const problemNumber = parseInt(parts[0].replace('Problem ', '').trim());
                        const answer = parts[1].trim();
                        const problemPath = `aops_amc8_problems_all_years/aops_amc8_${year}_problems/problem_${problemNumber}.png`;
                        problems.push({
                            year,
                            problemNumber,
                            problemPath,
                            answer
                        });
                    }
                }
            }
            console.log('Problems loaded:', problems);
            startGame();
        } catch (error) {
            console.error('Error loading problems:', error);
            alert('Failed to load problems. Please check the console for more details. It is likely that you are opening the file directly in the browser. You need to serve the files from a local web server.');
        }
    }

    function startGame() {
        console.log('startGame called');
        batchScore = 0;
        currentProblemIndex = 0;
        streak = 0;
        gameProblems = getRandomProblems(10);
        displayProblem();
        updateScoreDisplay();
        updateProgress();
        document.getElementById('streak-container').style.display = 'none';
        resultText.textContent = '';
        resultText.className = '';
        nextProblemBtn.style.display = 'none';
        restartGameBtn.style.display = 'none';
        removeSolutionButton(); // Remove any existing solution button
        answerButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('correct', 'incorrect');
        });
        startTimer();
    }

    function getRandomProblems(num) {
        const shuffled = problems.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    }

    function displayProblem() {
        if (currentProblemIndex < gameProblems.length) {
            const problem = gameProblems[currentProblemIndex];
            console.log('Displaying problem:', problem);
            problemImage.src = problem.problemPath;
            problemImage.onerror = () => {
                console.error('Image failed to load:', problem.problemPath);
                resultText.textContent = 'Image failed to load for this problem. Skipping to the next one.';
                // Wait a bit before loading the next problem
                setTimeout(() => {
                    currentProblemIndex++;
                    displayProblem();
                }, 2000);
            };
        }
    }

    function handleAnswerClick(event) {
        console.log('handleAnswerClick called');
        stopTimer();
        const selectedAnswer = event.target.textContent;
        const correctAnswer = gameProblems[currentProblemIndex].answer;

        answerButtons.forEach(button => {
            button.disabled = true;
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });

        if (selectedAnswer === correctAnswer) {
            const points = seconds < 90 ? 3 : 1;
            batchScore += points;
            totalScore += points;

            // Celebratory effects
            updateStreak(true);
            playCorrectSound();
            fireConfetti();

            resultText.textContent = getCelebratoryMessage(points, streak);
            resultText.className = 'correct fade-in-up';

            // Animate score
            const scoreSpan = document.getElementById('batch-score');
            scoreSpan.classList.add('score-pop');
            setTimeout(() => scoreSpan.classList.remove('score-pop'), 400);

            // Pulse the correct button
            event.target.classList.add('celebration-pulse');
        } else {
            updateStreak(false);
            playIncorrectSound();

            resultText.textContent = `❌ Incorrect. The correct answer is ${correctAnswer}.`;
            resultText.className = 'incorrect fade-in-up';
            event.target.classList.add('incorrect');
        }

        updateScoreDisplay();
        updateProgress();
        createSolutionButton(); // Create and show solution button after answer

        if (currentProblemIndex < gameProblems.length - 1) {
            nextProblemBtn.style.display = 'inline-block';
        } else {
            endGame();
        }
    }

    function handleNextProblem() {
        console.log('handleNextProblem called');
        currentProblemIndex++;
        displayProblem();
        resultText.textContent = '';
        resultText.className = '';
        nextProblemBtn.style.display = 'none';
        removeSolutionButton(); // Remove solution button for next problem
        answerButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('correct', 'incorrect', 'celebration-pulse');
        });
        updateProgress();
        startTimer();
    }

    async function endGame() {
        // Save scores to Firebase
        if (currentUsername) {
            await updateUserScore(currentUsername, batchScore, true);
            // Update the displayed total score
            const userData = await getUserData(currentUsername);
            totalScore = userData.totalScore || 0;
            updateScoreDisplay();
        }

        const finalMessage = `🎊 Game Complete! 🎊\n\nFinal Score: ${batchScore}/${gameProblems.length * 3}\n${batchScore >= 25 ? '🌟 Outstanding!' : batchScore >= 20 ? '🎉 Great job!' : batchScore >= 15 ? '👍 Good work!' : 'Keep playing!'}`;
        resultText.textContent = finalMessage;
        resultText.className = 'correct celebration-pulse';
        resultText.style.whiteSpace = 'pre-line';
        restartGameBtn.style.display = 'inline-block';
        nextProblemBtn.style.display = 'none';

        // Big celebration for completing the game
        if (batchScore >= 20) {
            setTimeout(() => fireConfetti(), 200);
            setTimeout(() => fireConfetti(), 400);
            setTimeout(() => fireConfetti(), 600);
        }
    }

    function updateScoreDisplay() {
        document.getElementById('batch-score').textContent = batchScore;
        document.getElementById('total-score').textContent = totalScore;
    }

    function createSolutionButton() {
        console.log('createSolutionButton called');
        removeSolutionButton(); // Ensure only one solution button exists
        const problem = gameProblems[currentProblemIndex];
        const solutionLink = document.createElement('button');
        solutionLink.id = 'solution-link';
        solutionLink.textContent = 'View Solution';
        solutionLink.type = 'button'; // Specify type as button
        solutionLink.addEventListener('click', () => {
            const problem = gameProblems[currentProblemIndex];
            window.open(`https://artofproblemsolving.com/wiki/index.php?title=${problem.year}_AMC_8_Problems/Problem_${problem.problemNumber}`, '_blank');
        });
        gameControls.insertBefore(solutionLink, nextProblemBtn); // Insert before nextProblemBtn
    }

    function removeSolutionButton() {
        console.log('removeSolutionButton called');
        const existingSolutionLink = document.getElementById('solution-link');
        if (existingSolutionLink) {
            existingSolutionLink.remove();
        }
    }

    answerButtons.forEach(button => {
        button.addEventListener('click', handleAnswerClick);
    });
    nextProblemBtn.addEventListener('click', handleNextProblem);
    restartGameBtn.addEventListener('click', startGame);

    loadProblems();
});