const readline = require('readline');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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

async function uploadVideo(token, videoPath) {
  console.log('\nUploading video...');
  const form = new FormData();
  form.append('video', fs.createReadStream(videoPath));

  const response = await fetch('http://localhost:5001/api/videos/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: form
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  console.log('Video uploaded successfully!');
  return data;
}

async function getVideo(token, identifier) {
  console.log('\nRetrieving video metadata...');
  const response = await fetch(`http://localhost:5001/api/videos/${identifier}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to retrieve video');
  }

  console.log('Video metadata retrieved successfully!');
  return data;
}

async function deleteVideo(token, identifier) {
  const confirmation = await promptUser('\nDo you want to delete the video? (yes/no): ');
  if (confirmation.toLowerCase() !== 'yes') {
    console.log('Video deletion cancelled.');
    return;
  }

  console.log('\nDeleting video...');
  const response = await fetch(`http://localhost:5001/api/videos/${identifier}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete video');
  }

  console.log('Video deleted successfully!');
}

async function main() {
  try {
    console.log('Video API Test');
    console.log('-------------');

    // Get credentials
    const username = await promptUser('Username: ');
    const password = await promptUser('Password: ');
    const videoPath = await promptUser('Path to video file: ');

    // Verify video file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error('Video file not found');
    }

    // Login
    const token = await login(username, password);

    // Upload video
    const uploadedVideo = await uploadVideo(token, videoPath);
    console.log('\nUploaded video details:');
    console.log(JSON.stringify(uploadedVideo, null, 2));

    // Get video metadata
    const videoMetadata = await getVideo(token, uploadedVideo.identifier);
    console.log('\nRetrieved video metadata:');
    console.log(JSON.stringify(videoMetadata, null, 2));

    // Delete video with confirmation
    await deleteVideo(token, uploadedVideo.identifier);

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

main(); 