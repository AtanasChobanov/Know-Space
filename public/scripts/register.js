document.querySelector('.form').addEventListener('submit', function (event) {
    const username = document.querySelector('input[name="username"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
  
    if (!username || !email || !password) {
      alert("Моля, попълнете всички полета!");
      event.preventDefault();
    }
  });