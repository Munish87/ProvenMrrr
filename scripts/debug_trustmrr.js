
const API_KEY = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";
const SLUG = "clawdi"; 

async function test() {
    try {
        const res = await fetch(`https://trustmrr.com/api/v1/startups/${SLUG}`, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
