chrome.runtime.onInstalled.addListener(() => {
    console.log("NeetCode Spaced Repetition installed!");
  });
  
  chrome.alarms.create("dailyReminder", { periodInMinutes: 1440 });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyReminder") {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "NeetCode Reminder",
        message: "Time to solve today's questions!"
      });
    }
  });
  