const readline = require('readline');
const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

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

async function main() {
  try {
    // Get credentials
    const username = await promptUser('Username: ');
    const password = await promptUser('Password: ');
    const token = await login(username, password);
    const headers = { Authorization: `Bearer ${token}` };

    // Create a project
    const projectRes = await axios.post(
      `${API_URL}/projects`,
      { name: 'Segment Test Project' },
      { headers }
    );
    const project = projectRes.data;
    console.log('Created project:', project.id);

    // Add a segment
    const addRes = await axios.post(
      `${API_URL}/segments/projects/${project.id}/segments`,
      {
        draftVideoId: null,
        upscaleVideoId: null,
        startFrame: 0,
        duration: 100,
        images: [], // Add image IDs if available
      },
      { headers }
    );
    const segment = addRes.data;
    console.log('Added segment:', segment.id);

    // Update the segment
    const updateRes = await axios.patch(
      `${API_URL}/segments/${segment.id}`,
      {
        startFrame: 10,
        duration: 120,
      },
      { headers }
    );
    const updated = updateRes.data;
    console.log('Updated segment:', updated.id, 'startFrame:', updated.startFrame, 'duration:', updated.duration);

    // Read back the segment and confirm patched values
    const getSegmentsRes = await axios.get(
      `${API_URL}/segments/projects/${project.id}/segments`,
      { headers }
    );
    const segments = getSegmentsRes.data;
    const found = segments.find(s => s.id === segment.id);
    if (!found) {
      throw new Error('Segment not found after patch');
    }
    if (found.startFrame !== 10 || found.duration !== 120) {
      throw new Error(`Patched values do not match. Got startFrame=${found.startFrame}, duration=${found.duration}`);
    }
    console.log('Confirmed patched segment values:', found.id, 'startFrame:', found.startFrame, 'duration:', found.duration);

    // Remove the segment
    const removeRes = await axios.delete(
      `${API_URL}/segments/${segment.id}`,
      { headers }
    );
    console.log('Removed segment:', segment.id, 'result:', removeRes.data);

    // Cleanup: delete the project
    await axios.delete(`${API_URL}/projects/${project.id}`, { headers });
    console.log('Deleted test project:', project.id);

    console.log('Segment API test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Segment API test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

main(); 