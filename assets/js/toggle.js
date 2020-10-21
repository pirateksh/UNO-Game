"use strict";

var toggle = document.querySelector('.toggle-input');
var initialState = localStorage.getItem('toggleState') == 'true';
toggle.checked = initialState;
toggle.addEventListener('change', function () {
  localStorage.setItem('toggleState', toggle.checked);
});

// Select the button
var btn = document.querySelector(".toggle-input");
if (localStorage.getItem('toggleState') === 'false') {
    document.body.classList.remove("dark-theme");
}

// Listen for a click on the button
btn.addEventListener("change", function() {
  // Then toggle (add/remove) the .dark-theme class to the body
  document.body.classList.toggle("dark-theme");
  
});