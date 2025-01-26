// Add a new problem
document.getElementById('problem-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const link = document.getElementById('problem-link').value;
  const title = document.getElementById('problem-title').value;
  const difficulty = document.getElementById('difficulty').value;

  // Calculate initial `nextReview` timestamp based on difficulty
  const now = Date.now();
  const nextReview = calculateNextReview(difficulty, now);

  const problem = {
    link,
    title,
    difficulty,
    addedAt: now,
    nextReview, // Use calculated next review time
  };

  console.log("Adding new problem:", problem);

  chrome.storage.sync.get({ problems: [] }, (data) => {
    const problems = data.problems;
    problems.push(problem);

    // Save back to Chrome storage
    chrome.storage.sync.set({ problems }, () => {
      console.log("Problem added successfully:", problems);
      displayProblemsForToday(); // Refresh the list of questions to revisit
    });
  });

  e.target.reset();
});

// Function to calculate next review date based on difficulty
function calculateNextReview(difficulty, lastReview, reviewCount = 1) {
  const baseIntervals = {
    easy: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    medium: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
    hard: 5 * 1000, // 1 day in milliseconds
  };

  let interval = baseIntervals[difficulty];

  // For "easy" problems, apply exponential growth only after the first review
  if (difficulty === "easy" && reviewCount > 1) {
    interval *= Math.pow(1.5, reviewCount - 1); // Exponential growth for subsequent reviews
  }

  const nextReview = lastReview + interval;
  console.log(
    `Next review for difficulty "${difficulty}" after ${reviewCount} reviews:`,
    new Date(nextReview)
  );
  return nextReview;
}



// Display problems due for review today
function displayProblemsForToday() {
  console.log("Displaying problems for today...");
  const reviewList = document.getElementById('review-list');
  reviewList.innerHTML = '';

  chrome.storage.sync.get({ problems: [] }, (data) => {
    console.log("Retrieved problems from storage:", data.problems);

    const now = Date.now();
    const dueProblems = data.problems.filter(problem => {
      const isDue = problem.nextReview <= now;
      console.log(`Problem "${problem.title}" due? ${isDue}`);
      return isDue;
    });

    if (dueProblems.length === 0) {
      reviewList.innerHTML = '<p>No questions to revisit today.</p>';
    } else {
      dueProblems.forEach(problem => {
        console.log("Displaying problem:", problem.title);
        const problemDiv = document.createElement('div');
        problemDiv.className = 'problem-item';
        problemDiv.innerHTML = `
          <p><a href="${problem.link}" target="_blank">${problem.title}</a></p>
          <p>Difficulty: ${problem.difficulty}</p>
          <label for="review-difficulty-${problem.link}">Rate Difficulty:</label>
          <select id="review-difficulty-${problem.link}" class="review-difficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button class="review-button" data-id="${problem.link}">Mark as Reviewed</button>
        `;
        reviewList.appendChild(problemDiv);
      });
    }
  });
}

// Mark a problem as reviewed and update the next review date
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('review-button')) {
    const problemLink = e.target.getAttribute('data-id');
    const difficultySelect = document.getElementById(`review-difficulty-${problemLink}`);
    const newDifficulty = difficultySelect ? difficultySelect.value : null;

    if (!newDifficulty) {
      console.error("Difficulty not selected or dropdown not found.");
      return;
    }

    console.log(`Marking problem "${problemLink}" as reviewed with difficulty "${newDifficulty}"`);

    chrome.storage.sync.get({ problems: [] }, (data) => {
      const problems = data.problems.map(problem => {
        if (problem.link === problemLink) {
          console.log(`Updating problem "${problem.title}"`);
          problem.difficulty = newDifficulty;
          problem.nextReview = calculateNextReview(newDifficulty, Date.now());
          console.log(`Next review for "${problem.title}" set to:`, new Date(problem.nextReview));
        }
        return problem;
      });

      chrome.storage.sync.set({ problems }, () => {
        console.log("Updated problems saved to storage:", problems);
        displayProblemsForToday();
      });
    });
  }
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', displayProblemsForToday);






