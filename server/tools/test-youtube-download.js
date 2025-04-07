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

async function login(username, password) {
  console.log('\nLogging in...');
  const response = await fetch('http://localhost:5001/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      password: password,
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  console.log('Login successful!');
  return data.token;
}

async function downloadYouTubeVideo(token, url) {
  console.log('\nDownloading YouTube video...');
  const response = await fetch('http://localhost:5001/api/videos/youtube', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Download failed');
  }

  console.log('Video downloaded successfully!');
  return data;
}

async function main() {
  try {
    console.log('YouTube Video Download Test');
    console.log('-------------------------');

    // Get credentials and video URL
    const username = await promptUser('Username: ');
    const password = await promptUser('Password: ');
    const youtubeUrl = await promptUser('YouTube URL: ');

    // Login
    const token = await login(username, password);

    // Download video
    const downloadedVideo = await downloadYouTubeVideo(token, youtubeUrl);
    console.log('\nDownloaded video details:');
    console.log(JSON.stringify(downloadedVideo, null, 2));

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

main(); 