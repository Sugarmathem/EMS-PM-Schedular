const axios = require("axios");
const schedule = require("../data/schedule.json");

const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!WEBHOOK_URL) {
    throw new Error("WEBHOOK_URL secret not found.");
}

const EMBED_COLOR = 0x1F3A5F;

const now = new Date();

// UTC+5
const utc5 = new Date(now.getTime() + (5 * 60 * 60 * 1000));

const month = utc5.getUTCMonth() + 1;
const day = utc5.getUTCDate();
const year = utc5.getUTCFullYear();

function monthMatches(startMonth, repeatEveryMonths) {
    let diff = month - startMonth;

    while (diff < 0) diff += 12;

    return diff % repeatEveryMonths === 0;
}

async function sendEmbed(item) {

    const monthName = utc5.toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC"
    });

    const dateText =
        item.startDay === item.endDay
            ? `${monthName} ${item.startDay}, ${year}`
            : `${monthName} ${item.startDay}-${item.endDay}, ${year}`;

    const embed = {
        title: "🚨 Notices ─ PM DUE",
        color: EMBED_COLOR,
        description:
            "────────────────────────",
        fields: [
            {
                name: "📅 Units Due",
                value:
                    `**Date**\n${dateText}\n\n${item.units}`,
                inline: false
            },
            {
                name: "🔧 Maintenance Type",
                value:
                    "General Maintenance",
                inline: false
            },
            {
                name: "Reminder",
                value:
                    "Please complete all PMs within the scheduled dates.\n\nRemember to log PM completion using `?pmc`.",
                inline: false
            }
        ],
        footer: {
            text: "EMS Logistics Division"
        },
        timestamp: new Date().toISOString()
    };

    await axios.post(WEBHOOK_URL, {
        embeds: [embed]
    });

    console.log(`Sent reminder for ${item.units}`);
}

(async () => {

    for (const item of schedule) {

        if (!monthMatches(item.startMonth, item.repeatEveryMonths))
            continue;

        if (day !== item.startDay)
            continue;

        await sendEmbed(item);
    }

})();
