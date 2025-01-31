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
    reviewCount: 0, // Start with review count of 0
  };

  console.log("Adding new problem:", problem);

  chrome.storage.sync.get({ problems: [] }, (data) => {
    const problems = data.problems;

    // Prevent duplicates and only add if problem doesn't already exist
    const problemIndex = problems.findIndex(problem => problem.link === link);
    if (problemIndex === -1) {
      problems.push(problem); // Add the new problem
      console.log("Problem added successfully:", problem);
    } else {
      console.log("Problem already exists, updating the review count and next review.");
      // If the problem exists, just update the next review date and review count
      const existingProblem = problems[problemIndex];
      existingProblem.reviewCount = 0; // Reset review count to 0
      existingProblem.nextReview = nextReview; // Reset nextReview
    }

    // Save back to Chrome storage
    chrome.storage.sync.set({ problems }, () => {
      console.log("Problems saved to storage.");
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
    hard: 3 * 1000, // 1 day in milliseconds
  };

  let interval = baseIntervals[difficulty];

  // For "easy" problems, apply exponential growth only after the first review
  if (difficulty === "easy" && reviewCount > 1) {
    interval *= Math.pow(1.5, reviewCount - 1); // Exponential growth for subsequent reviews
  }

  const nextReview = lastReview + interval;
  console.log(`Next review for difficulty "${difficulty}" after ${reviewCount} reviews:`, new Date(nextReview));
  return nextReview;
}

// Add event listener to reset button
document.getElementById('reset-button').addEventListener('click', () => {
  console.log('Resetting progress for all problems...');

  // Get all problems from storage
  chrome.storage.sync.get({ problems: [] }, (data) => {
    const problems = data.problems;

    // Reset reviewCount and nextReview for each problem
    const updatedProblems = problems.map(problem => {
      // Reset the review count
      problem.reviewCount = 0;

      // Reset nextReview to a future date (e.g., 7 days from now for "easy" problems)
      const futureReviewDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

      // Reset the nextReview to the future date (customize based on difficulty if desired)
      problem.nextReview = futureReviewDate;

      return problem;
    });

    // Save updated problems back to storage
    chrome.storage.sync.set({ problems: updatedProblems }, () => {
      console.log('Progress reset for all problems.');
      displayProblemsForToday(); // Update the UI to reflect changes
    });
  });
});

// Display problems due for review today
function displayProblemsForToday() {
  console.log("Displaying problems for today...");
  const reviewList = document.getElementById('review-list');
  
  // Clear the current list to avoid duplicates
  reviewList.innerHTML = '';

  chrome.storage.sync.get({ problems: [] }, (data) => {
    console.log("Problems retrieved from storage:", data.problems);

    const now = Date.now();
    const dueProblems = data.problems.filter(problem => problem.nextReview <= now);

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

// Add event listener to mark as reviewed
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
          problem.reviewCount = (problem.reviewCount || 0) + 1;
          problem.nextReview = calculateNextReview(newDifficulty, Date.now(), problem.reviewCount);
          console.log(`Next review for "${problem.title}" set to:`, new Date(problem.nextReview));
        }
        return problem;
      });

      chrome.storage.sync.set({ problems }, () => {
        console.log("Updated problems saved to storage.");
        displayProblemsForToday(); // Refresh the list after updating
      });
    });
  }
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', displayProblemsForToday);
