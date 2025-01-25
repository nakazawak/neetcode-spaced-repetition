const questions = [
    {
      id: 1,
      name: "Two Sum",
      url: "https://neetcode.io/problems/two-integer-sum",
      lastReviewed: null,
      interval: 1
    },
  ];
  
  function getTodayQuestion() {
    const today = new Date().toISOString().split("T")[0];
    const dueQuestions = questions.filter((q) => {
      if (!q.lastReviewed) return true; // If never reviewed, it's due today
      const dueDate = new Date(q.lastReviewed);
      dueDate.setDate(dueDate.getDate() + q.interval);
      return dueDate.toISOString().split("T")[0] === today;
    });
  
    // Return the first due question (or null if none)
    return dueQuestions.length > 0 ? dueQuestions[0] : null;
  }
  
  export { getTodayQuestion };
  