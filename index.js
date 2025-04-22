import { eventSource, event_types } from '../../../script.js';

// Function to add the log button to a message element
function addLogButton(messageElement, mes) {
  // Find the area where message action buttons usually go
  const buttonsContainer = messageElement.querySelector('.mes_buttons');

  // Only proceed if the container exists and our button isn't already there
  if (buttonsContainer && !buttonsContainer.querySelector('.test-main-log-button')) {
    const button = document.createElement('button');
    button.textContent = 'Log';
    button.classList.add('test-main-log-button', 'fa-button'); // Added fa-button for some base styling if needed

    button.addEventListener('click', event => {
      event.stopPropagation(); // Prevent potential parent handlers
      console.log('[test-main] Message Text:', mes.mes);
      console.log('[test-main] Message Object:', mes);
      toastr.info(`Message logged to console (ID: ${mes.mesid})`); // Provide visual feedback
    });

    // Prepend the button to the container
    buttonsContainer.prepend(button);
  } else if (!buttonsContainer) {
    // Fallback or logging if the expected container isn't found
    console.warn('[test-main] Could not find .mes_buttons container for message:', mes.mesid);
  }
}

// Listen for when a new message is added to the chat DOM
eventSource.on(event_types.MESSAGE_ADDED, (mes, messageElement) => {
  // Wait a moment for the message element to be fully rendered, especially buttons
  setTimeout(() => {
    addLogButton(messageElement, mes);
  }, 100); // Small delay might help ensure .mes_buttons is ready
});

// Optional: Handle chat updates or re-renders if needed
// eventSource.on(event_types.CHAT_UPDATED, () => {
//     console.log('[test-main] Chat updated, checking messages for log buttons.');
//     document.querySelectorAll('.mes').forEach(msgElement => {
//         // This part is tricky as we don't have the 'mes' object directly here.
//         // Would need a way to map msgElement back to its data or re-fetch.
//         // Keeping it simple for now.
//     });
// });

console.log('[test-main] Plugin loaded.');
