import { getTodayQuestion } from "./spaced-repetition.js";

document.addEventListener("DOMContentLoaded", () => {
  const problemTitle = document.getElementById("problem-title");
  const goToProblemButton = document.getElementById("go-to-problem");

  // Fetch the problem of the day using spaced repetition logic
  const question = getTodayQuestion();

  if (question) {
    // Display the problem title in the popup
    problemTitle.textContent = question.name;

    // Set up the button to open the problem's URL
    goToProblemButton.addEventListener("click", () => {
        console.log(`Opening URL: ${question.url}`);
        chrome.tabs.create({ url: question.url }); // Opens the problem in a new browser tab
    });
  } else {
    // Handle case where no problem is scheduled
    problemTitle.textContent = "No question scheduled for today.";
    goToProblemButton.disabled = true; // Disable the button if no question
  }
});

