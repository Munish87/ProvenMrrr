const API_KEY = "tmrr_79f0254ed1c51dc75dbd48fdbd66281e";

async function test() {
    const slug = process.argv[2] || 'gumroad';
    try {
        const detailRes = await fetch(`https://trustmrr.com/api/v1/startups/${slug}`, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
        });
        const detailJson = await detailRes.json();
        const d = detailJson.data || {};
        console.log('Keys:', Object.keys(d).join(", "));
        console.log('Revenue object:', JSON.stringify(d.revenue, null, 2));
        console.log('Monthly Revenue:', d.monthlyRevenue);
        console.log('Revenue 30d:', d.revenueLast30Days);
        console.log('Revenue 12m:', d.revenueLast12Months);
        console.log('Revenue total:', d.revenueTotal);
        console.log('Full sample:', JSON.stringify(d, null, 2).slice(0, 1000));
    } catch (e) {
        console.error(e);
    }
}

test();
