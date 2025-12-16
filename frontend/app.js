
// JavaScript code for To-Do app functionality

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const devopsPopup = document.getElementById('devopsPopup');
const closePopupBtn = document.getElementById('closePopupBtn');
const closePopup = document.getElementById('closePopup');

// Function to add a task to the list
function addTask() {
  const taskName = taskInput.value.trim();
  if (taskName) {
    const li = document.createElement('li');
    li.textContent = taskName;
    taskList.appendChild(li);
    taskInput.value = '';  // Clear input field
  }
}

// Event listener to add task on button click
addTaskBtn.addEventListener('click', addTask);

// Optionally, add task by pressing Enter key
taskInput.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

// Show the DevOps popup on page load
window.onload = function() {
  devopsPopup.style.display = "block";
};

// Close the popup when the user clicks "SCHLIESSEN"
closePopupBtn.addEventListener('click', function() {
  devopsPopup.style.display = "none";
});

// Close the popup when the user clicks the "X" icon
closePopup.addEventListener('click', function() {
  devopsPopup.style.display = "none";
});
