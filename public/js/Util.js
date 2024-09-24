//show dynamic confirm alert
const dynamicAlertElement ='dynamc-alert';

export function showDynamicConfirm(message ){
    // Create the modal container
    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal';

    // Create the modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'confirm-modal';

    // Create the message paragraph
    const messageParagraph = document.createElement('p');
    messageParagraph.id = 'confirm-message';
    messageParagraph.textContent = message;

    // Create the buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'confirm-buttons';

    // Create the "Yes" button
    const confirmButton = document.createElement('button');
    confirmButton.id = 'confirm-delete';
    confirmButton.className = 'btn btn-sm btn-dark';
    confirmButton.textContent = 'Yes';

    // Create the "Cancel" button
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-delete';
    cancelButton.className = 'btn btn-sm btn-dark';
    cancelButton.textContent = 'Cancel';

    // Append buttons to the container
    buttonsContainer.appendChild(confirmButton);
    buttonsContainer.appendChild(cancelButton);

    // Append elements to the modal content
    modalContent.appendChild(messageParagraph);
    modalContent.appendChild(buttonsContainer);

    // Append the modal content to the modal container
    modal.appendChild(modalContent);

    // Append the modal to the body
    document.body.appendChild(modal);

    // Display the modal
    modal.style.display = 'block';

    // Add event listeners for buttons
    confirmButton.addEventListener('click', () => {
        // Handle confirmation (you can customize this)
        console.log('Confirmed');
        closeModal();
    });

    cancelButton.addEventListener('click', closeModal);

    // Function to close the modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }

}


/* show dynamic alert instead of the normal borwser alert */
export function showDynamicAlert(message, targetElement) {
    // Remove any existing alert
    let existingAlert = document.getElementById(dynamicAlertElement);
    if (existingAlert) {
      existingAlert.remove();
    }
  
    // Create the alert div
    let alertDiv = document.createElement('div');
    alertDiv.id = dynamicAlertElement;
    alertDiv.textContent = message;
    alertDiv.style.position = 'absolute';
    alertDiv.style.padding = '10px';
    alertDiv.style.width="80dwh"
    alertDiv.style.backgroundColor = '#f44336'; // Red background
    alertDiv.style.color = 'white';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.zIndex = 1000; // Ensure it's above other content
    alertDiv.style.boxShadow = '5px 5px 10px rgba(70, 50, 12, 0.7)';
    alertDiv.style.cursor = 'pointer';
    alertDiv.style.fontFamily=`'Segoe UI',Serif`;
  
    // Position the alert near the target element
    const rect = targetElement.getBoundingClientRect();
    alertDiv.style.left = `${rect.left + window.scrollX}px`;
    alertDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
  
    // Append the alert to the body
    document.body.appendChild(alertDiv);
  
    // Add click event to remove the alert
    alertDiv.addEventListener('click', function() {
      alertDiv.remove();
    });
  }
//delete poem via an asynchronous call
export async function delPoem(postId) {
  try {
    const response = await fetch(`/delete/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // Handle successful deletion, e.g., update UI
    console.log('Post deleted successfully');
    // Redirect if necessary (could be done here or elsewhere)
    // window.location.href = "/";
  } catch (error) {
    console.error('Error deleting post:', error);
    // Handle error, e.g., display error message to user
  }
}