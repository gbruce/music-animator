const readline = require('readline');
const fetch = require('node-fetch');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function login() {
  try {
    console.log('Music Animator Login');
    console.log('-------------------');
    
    const email = await promptUser('Email: ');
    const password = await promptUser('Password: ');

    const response = await fetch('http://localhost:5001/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    console.log('\nLogin successful!');
    console.log('\nYour JWT token:');
    console.log('-------------------');
    console.log(data.token);
    console.log('\nUse this token in the Authorization header like this:');
    console.log('Authorization: Bearer ' + data.token);
    
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

login(); 