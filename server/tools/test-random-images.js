const fetch = require('node-fetch');
const readline = require('readline');

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
  console.log('\nLogging in...');
  const username = await promptUser('Username: ');
  const password = await promptUser('Password: ');

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

async function testRandomImages(token, count) {
  try {
    console.log(`\nTesting random images API (count: ${count})`);
    console.log('----------------------------------------');

    const response = await fetch(`http://localhost:5001/api/images/random?count=${count}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get random images');
    }

    console.log('\nSuccessfully retrieved random images:');
    console.log('----------------------------------------');
    console.log(`Number of images returned: ${data.length}`);
    
    data.forEach((image, index) => {
      console.log(`\nImage ${index + 1}:`);
      console.log(`- ID: ${image.id}`);
      console.log(`- Identifier: ${image.identifier}`);
      console.log(`- File Path: ${image.filePath}`);
      console.log(`- Dimensions: ${image.width}x${image.height}`);
      console.log(`- File Size: ${image.fileSize} bytes`);
      console.log(`- Type: ${image.imageType}`);
      console.log(`- Upload Date: ${new Date(image.uploadDate).toLocaleString()}`);
      console.log(`- Filename: ${image.filename}`);
      console.log(`- User ID: ${image.userId}`);
      console.log(`- Folder ID: ${image.folderId || 'None'}`);
    });

  } catch (error) {
    console.error('\nError:', error.message);
  }
}

async function runTests() {
  try {
    console.log('Random Images API Test');
    console.log('---------------------');
    
    // Get token through login
    const token = await login();
    
    // Test with different counts
    await testRandomImages(token, 4); // Default count
    await testRandomImages(token, 2); // Less than default
    await testRandomImages(token, 10); // More than default
    
  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    rl.close();
  }
}

// Run the tests
runTests(); 