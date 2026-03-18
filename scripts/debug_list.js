
const API_KEY = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";

async function test() {
    try {
        const res = await fetch(`https://trustmrr.com/api/v1/startups?page=1&limit=5`, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
        });
        const data = await res.json();
        console.log(JSON.stringify(data.data[0].revenue, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
