// Native fetch used
const BASE_URL = 'http://localhost:3001';
const MOCK_FILES = [
    {
        url: 'https://example.com/blob/test.txt',
        pathname: 'uploads/TESTCODE/test.txt',
        originalName: 'test.txt',
        size: 1024,
        mimeType: 'text/plain'
    }
];

async function runTests() {
    console.log('Starting Verification Tests...');

    // 1. Test Upload Token
    console.log('\n--- Test 1: Generate Upload Token ---');
    try {
        const res = await fetch(`${BASE_URL}/api/blob/upload-token`, {
            method: 'POST',
            body: JSON.stringify({
                type: 'blob.upload',
                payload: {
                    pathname: 'uploads/TESTCODE/test.txt',
                    clientPayload: null,
                    multipart: false
                }
            })
        });
        // Note: This might fail if we don't strictly adhere to the Vercel Blob protocol or if env vars aren't fully set for the server context
        // But we expect a response.
        if (res.status === 200) {
            const data = await res.json();
            if (data.type === 'blob.generate-client-token') {
                console.log('✅ Token Generated');
            } else {
                console.log('⚠️ Unexpected response format:', data);
            }
        } else {
            console.log('❌ Token Generation Failed:', res.status, await res.text());
        }
    } catch (e) {
        console.log('❌ Token Test Error:', e.message);
    }


    // 2. Test Metadata Registration
    const shareCode = 'TESTVERIFY' + Math.floor(Math.random() * 1000);
    console.log(`\n--- Test 2: Register Metadata (Code: ${shareCode}) ---`);
    try {
        const res = await fetch(`${BASE_URL}/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shareCode,
                files: MOCK_FILES,
                settings: { expiryMinutes: 10, maxDownloads: 2 }
            })
        });

        if (res.ok) {
            console.log('✅ Metadata Registered');
        } else {
            console.log('❌ Registration Failed:', res.status, await res.text());
            return; // Stop if registration fails
        }
    } catch (e) {
        console.log('❌ Registration Error:', e.message);
        return;
    }

    // 3. Test Preview (GET)
    console.log('\n--- Test 3: Preview Metadata ---');
    try {
        const res = await fetch(`${BASE_URL}/api/share/${shareCode}`);
        if (res.ok) {
            const data = await res.json();
            if (data.code === shareCode && data.downloadsLeft === 2) {
                console.log('✅ Preview Successful:', JSON.stringify(data));
            } else {
                console.log('❌ Preview Data Mismatch:', data);
            }
        } else {
            console.log('❌ Preview Failed:', res.status, await res.text());
        }
    } catch (e) {
        console.log('❌ Preview Error:', e.message);
    }

    // 4. Test Claim (POST) - First Download
    console.log('\n--- Test 4: Claim Download (1st) ---');
    try {
        const res = await fetch(`${BASE_URL}/api/share/${shareCode}/download`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            if (data.url === MOCK_FILES[0].url) {
                console.log('✅ Claim Successful. URL returned.');
            } else {
                console.log('❌ Claim Data Mismatch:', data);
            }
        } else {
            console.log('❌ Claim Failed:', res.status, await res.text());
        }
    } catch (e) {
        console.log('❌ Claim Error:', e.message);
    }

    // 5. Verify Decrement
    console.log('\n--- Test 5: Verify Decrement ---');
    try {
        const res = await fetch(`${BASE_URL}/api/share/${shareCode}`);
        const data = await res.json();
        if (data.downloadsLeft === 1) {
            console.log('✅ Decrement Verified (Left: 1)');
        } else {
            console.log('❌ Decrement Failed (Left: ' + data.downloadsLeft + ')');
        }
    } catch (e) {
        console.log('❌ Verify Error:', e.message);
    }
}

runTests();
