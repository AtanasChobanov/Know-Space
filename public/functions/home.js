document.addEventListener('DOMContentLoaded', function () {
    const registerButton = document.querySelector('.register-button');
    const loginButton = document.querySelector('.login-button');
    
    registerButton.addEventListener('click', function () {
      console.log('Регистрация...');
    });
    
    loginButton.addEventListener('click', function () {
      console.log('Влизане...');
    });
  });
  