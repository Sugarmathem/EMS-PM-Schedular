const axios = require("axios");
const schedule = require("../data/schedule.json");

const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!WEBHOOK_URL) {
    console.error("Missing WEBHOOK_URL secret.");
    process.exit(1);
}

const EMBED_COLOR = 0x1F3A5F;

const now = new Date();

// UTC+5
const utc5 = new Date(now.getTime() + (5 * 60 * 60 * 1000));

const month = utc5.getUTCMonth() + 1;
const day = utc5.getUTCDate();
const year = utc5.getUTCFullYear();

function shouldRun(entry) {

    let diff = month - entry.startMonth;

    while (diff < 0) {
        diff += 12;
    }

    if (diff % entry.repeatEveryMonths !== 0)
        return false;

    return day === entry.startDay;
}

function monthName(monthNumber) {

    return new Date(
        Date.UTC(year, monthNumber - 1, 1)
    ).toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC"
    });

}

function buildEmbed(entry) {

    const date =
        entry.startDay === entry.endDay
            ? `${monthName(month)} ${entry.startDay}, ${year}`
            : `${monthName(month)} ${entry.startDay}-${entry.endDay}, ${year}`;

    return {

        username: "EMS Logistics",

        embeds: [
            {
                color: EMBED_COLOR,

                title: "🚨 Notices ─ PM DUE",

                description:
`────────────────────────

📅 **The following units are due for maintenance**

• Date:
${date}

${entry.units}

────────────────────────

🔧 **Maintenance Type**

• General Maintenance

────────────────────────

Please complete all PMs within the scheduled dates.

Remember to log PM completion using

\`?pmc\``,

                footer: {
                    text: "EMS Logistics Division"
                },

                timestamp: new Date().toISOString()
            }
        ]
    };

}

async function send(entry) {

    try {

        await axios.post(
            WEBHOOK_URL,
            buildEmbed(entry)
        );

        console.log(
            `Sent reminder for ${entry.units}`
        );

    }

    catch(err){

        console.error(err.response?.data || err);

    }

}

(async () => {

    let sent = false;

    for(const entry of schedule){

        if(!shouldRun(entry))
            continue;

        await send(entry);

        sent = true;

    }

    if(!sent){

        console.log("Nothing scheduled today.");

    }

})();
