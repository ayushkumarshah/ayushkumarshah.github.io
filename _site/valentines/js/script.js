//document.getElementById("yesButton").addEventListener("click", () => {
//    alert("Yay! You said YES! 🥰");
//    // Add confetti animation or redirect to another page here
//});

document.getElementById("noButton").addEventListener("click", () => {
    alert("Oh no! But I love you anyway. ❤️");
});

document
.getElementById("noButton")
.addEventListener("click", function () {
  var yesButton = document.querySelector(
    'button[onclick*="thankyou.html"]'
  );
  var currentFontSize = parseInt(
    window.getComputedStyle(yesButton).fontSize
  );
  yesButton.style.fontSize = currentFontSize + 10 + "px"; // Increase font size by 5px
});
