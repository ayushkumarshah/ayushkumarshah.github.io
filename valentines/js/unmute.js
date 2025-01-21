// Get references to the video and button
const video = document.getElementById('valentineVideo');
const unmuteButton = document.getElementById('unmuteButton');

// Add an event listener to the button
unmuteButton.addEventListener('click', () => {
    if (video.muted) {
        video.muted = false; // Unmute the video
        unmuteButton.textContent = 'Mute'; // Change button text
    } else {
        video.muted = true; // Mute the video
        unmuteButton.textContent = 'Unmute'; // Change button text
    }
});
