// Simple test script to understand SmartSQL behavior
// This will help us debug the database issues

const BACKEND_URL = 'https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';

async function testSmartSQL() {
  console.log('Testing SmartSQL behavior...\n');

  // Test 1: Try to select from personas table
  console.log('Test 1: SELECT from personas');
  try {
    const response = await fetch(`${BACKEND_URL}/api/personas`);
    const data = await response.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Try to seed personas
  console.log('Test 2: Seed personas');
  try {
    const response = await fetch(`${BACKEND_URL}/api/seed-personas`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSmartSQL().catch(console.error);
