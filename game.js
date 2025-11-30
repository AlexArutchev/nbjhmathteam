document.addEventListener('DOMContentLoaded', () => {
    // Username and Leaderboard System
    let currentUsername = null;

    // LocalStorage Management
    function getGameData() {
        const data = localStorage.getItem('amc8GameData');
        return data ? JSON.parse(data) : { currentUser: null, users: {} };
    }

    function saveGameData(data) {
        localStorage.setItem('amc8GameData', JSON.stringify(data));
    }

    function getUserData(username) {
        const gameData = getGameData();
        return gameData.users[username] || {
            totalScore: 0,
            bestBatchScore: 0,
            gamesPlayed: 0,
            lastPlayed: new Date().toISOString()
        };
    }

    function updateUserScore(username, batchScore, addToTotal) {
        const gameData = getGameData();
        const userData = getUserData(username);

        userData.gamesPlayed++;
        userData.lastPlayed = new Date().toISOString();

        if (batchScore > userData.bestBatchScore) {
            userData.bestBatchScore = batchScore;
        }

        if (addToTotal) {
            userData.totalScore += batchScore;
        }

        gameData.users[username] = userData;
        gameData.currentUser = username;
        saveGameData(gameData);

        updateLeaderboard();
        updateUserStats();
    }

    function getLeaderboard(type = 'batch') {
        const gameData = getGameData();
        const users = gameData.users;

        const leaderboard = Object.entries(users).map(([username, data]) => ({
            username,
            score: type === 'batch' ? data.bestBatchScore : data.totalScore
        }));

        leaderboard.sort((a, b) => b.score - a.score);
        return leaderboard.slice(0, 3);
    }

    function updateLeaderboard() {
        const batchLeaderboard = getLeaderboard('batch');
        const totalLeaderboard = getLeaderboard('total');

        renderLeaderboard('batch-leaderboard', batchLeaderboard);
        renderLeaderboard('total-leaderboard', totalLeaderboard);
    }

    function renderLeaderboard(elementId, leaderboard) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        if (leaderboard.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No scores yet</p>';
            return;
        }

        leaderboard.forEach((entry, index) => {
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
            score.textContent = entry.score;

            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(score);
            container.appendChild(item);
        });
    }

    function updateUserStats() {
        if (!currentUsername) return;

        const userData = getUserData(currentUsername);
        const statsContainer = document.getElementById('user-stats-content');

        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Username:</span>
                <span class="stat-value">${currentUsername}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Games Played:</span>
                <span class="stat-value">${userData.gamesPlayed}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Best Batch:</span>
                <span class="stat-value">${userData.bestBatchScore}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Score:</span>
                <span class="stat-value">${userData.totalScore}</span>
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

    function handleUsernameSubmit() {
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
        const gameData = getGameData();
        gameData.currentUser = username;

        if (!gameData.users[username]) {
            gameData.users[username] = {
                totalScore: 0,
                bestBatchScore: 0,
                gamesPlayed: 0,
                lastPlayed: new Date().toISOString()
            };
        }

        saveGameData(gameData);
        hideUsernameModal();
        updateLeaderboard();
        updateUserStats();

        // Load user's total score
        const userData = getUserData(username);
        totalScore = userData.totalScore;
        updateScoreDisplay();
    }

    // Leaderboard Toggle
    document.getElementById('leaderboard-toggle').addEventListener('click', () => {
        const panel = document.getElementById('leaderboard-panel');
        panel.classList.toggle('hidden');
        updateLeaderboard();
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
    const gameData = getGameData();
    if (gameData.currentUser) {
        currentUsername = gameData.currentUser;
        const userData = getUserData(currentUsername);
        totalScore = userData.totalScore;
        updateLeaderboard();
        updateUserStats();
    } else {
        showUsernameModal();
    }

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

    function endGame() {
        // Save scores to localStorage
        if (currentUsername) {
            updateUserScore(currentUsername, batchScore, true);
            // Update the displayed total score
            const userData = getUserData(currentUsername);
            totalScore = userData.totalScore;
            updateScoreDisplay();
        }

        const finalMessage = `🎊 Game Complete! 🎊\n\nFinal Score: ${batchScore}/${gameProblems.length * 3}\n${batchScore >= 25 ? '🌟 Outstanding!' : batchScore >= 20 ? '🎉 Great job!' : batchScore >= 15 ? '👍 Good work!' : '💪 Keep practicing!'}`;
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