// Function to fetch and display coupon history
async function fetchCouponHistory() {
  const historyList = document.getElementById('historyList');

  try {
    const response = await fetch("https://coupon-distributor.vercel.app/history", {
      credentials: 'include', // Include cookies in the request
    });    
    const result = await response.json();

    // Log the response for debugging
    console.log('History Response:', result);

    // Clear the existing history
    historyList.innerHTML = '';

    // Add each coupon to the history list
    result.history.forEach((assignment) => {
      const historyItem = document.createElement('li');
      historyItem.textContent = `Claimed: ${assignment.coupon} at ${new Date(assignment.timestamp).toLocaleString()}`;
      historyList.appendChild(historyItem);
    });
  } catch (error) {
    console.error('Error fetching coupon history:', error);
  }
}

// Fetch and display coupon history when the page loads
document.addEventListener('DOMContentLoaded', fetchCouponHistory);

// Helper function to convert seconds to 00:00 format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Existing coupon claim logic
document.getElementById('claimButton').addEventListener('click', async () => {
  const button = document.getElementById('claimButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const messageElement = document.getElementById('message');
  const historyList = document.getElementById('historyList');

  // Disable the button and show loading spinner
  button.disabled = true;
  buttonText.style.visibility = 'hidden';
  loadingSpinner.style.display = 'block';

  try {
    // Use the full URL for the fetch call
    const response = await fetch("https://coupon-distributor.vercel.app/claim", {
      credentials: 'include', // Include cookies in the request
    });
    const result = await response.json();

    // Update the message
    if (response.status === 429) {
      messageElement.classList.add('error');
      messageElement.textContent = result.message;

      // Start the countdown timer
      let remainingTime = result.remainingTime;
      const timerInterval = setInterval(() => {
        if (remainingTime > 0) {
          // Format the remaining time as 00:00
          const formattedTime = formatTime(remainingTime);
          messageElement.textContent = `Please try again in ${formattedTime}.`;
          remainingTime--;
        } else {
          clearInterval(timerInterval);
          messageElement.textContent = 'You can now claim another coupon!';
          messageElement.classList.remove('error');
        }
      }, 1000);
    } else {
      messageElement.classList.remove('error');
      messageElement.textContent = result.message;
    }

    // Add the claimed coupon to the history
    if (response.ok) {
      const historyItem = document.createElement('li');
      historyItem.textContent = `Claimed: ${result.message.split(': ')[1]} at ${new Date().toLocaleString()}`;
      historyList.appendChild(historyItem);
    }
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    messageElement.textContent = 'An error occurred. Please try again.';
    messageElement.classList.add('error');
  } finally {
    // Re-enable the button and hide loading spinner
    button.disabled = false;
    buttonText.style.visibility = 'visible';
    loadingSpinner.style.display = 'none';
  }
});