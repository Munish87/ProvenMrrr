
const API_KEY = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";

async function test() {
    try {
        const listRes = await fetch(`https://trustmrr.com/api/v1/startups?page=1&limit=10`, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
        });
        const listData = await listRes.json();
        for (const startup of listData.data) {
            const detailRes = await fetch(`https://trustmrr.com/api/v1/startups/${startup.slug}`, {
                headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
            });
            const detailData = await detailRes.json();
            console.log(`Startup: ${startup.name}`);
            console.log(`Tech Stack:`, detailData.data.tech_stack);
            console.log(`Visitors:`, detailData.data.total_visitors);
            console.log(`---`);
            await new Promise(r => setTimeout(r, 3100)); // Respect rate limit
        }
    } catch (e) {
        console.error(e);
    }
}

test();
