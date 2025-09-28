// Function to generate a random 5-character alphanumeric code
function generateCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length)).toUpperCase();
  }
  return code;
}

// Select all forms on the page
const forms = document.querySelectorAll('form');

// Assign a unique 5-char alphanumeric code to each form
forms.forEach((form) => {
  form.dataset.formCode = generateCode();
//   console.log(`Form ID: ${form.id}, Code: ${form.dataset.formCode}`);
});
