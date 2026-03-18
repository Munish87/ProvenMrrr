const API_KEY = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";
const BASE_URL = "https://trustmrr.com/api/v1";

async function testFetch() {
    try {
        console.log("Fetching from TrustMRR...");
        const response = await fetch(`${BASE_URL}/startups`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Accept": "application/json"
            }
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data keys:", Object.keys(data));
        console.log("Full data sample:", JSON.stringify(data).substring(0, 500));
        
        const startups = Array.isArray(data) ? data : data.startups || [];
        console.log("Startups count:", startups.length);
        if (startups.length > 0) {
            console.log("First startup sample:", JSON.stringify(startups[0]));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testFetch();
