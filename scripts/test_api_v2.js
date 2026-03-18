const slugs = ["pixel-money", "gumroad"];
const apiKey = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";
const baseUrl = "https://trustmrr.com/api/v1";

async function test() {
    for (const slug of slugs) {
        console.log(`--- Fetching ${slug} ---`);
        try {
            const res = await fetch(`${baseUrl}/startups/${slug}`, {
                headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
            });
            if (res.ok) {
                const json = await res.json();
                console.log(JSON.stringify(json, null, 2));
            } else {
                console.error(`API Error for ${slug}: ${res.status} ${res.statusText}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

test();
