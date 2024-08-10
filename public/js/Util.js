//show dynamic confirm alert
const dynamicAlertElement ='dynamc-alert';
const dynamicConfirmElementID ='confirmModal';
const confirmModalClass='modal';
const confirmModalSubClass='confirm-modal';
const confirmButtonsClass='confirm-buttons';
const buttonFormatClasses='btn  btn-sm btn-dark';
const deleteID='confirm-delete';
const cancelID='cancel-delete';
const messageID='onfirm-message';
export function showDynamicConfirm(message){
  let existingAlert =document.getElementById(dynamicConfirmElement);
  if(existingAlert){
    existingAlert.remove();
  }
  let alertDiv=document.createElement('div');
  alertDiv.id(dynamicConfirmElementID);
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