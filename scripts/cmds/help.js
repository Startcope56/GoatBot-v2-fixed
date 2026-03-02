const fs = require("fs-extra");
const path = require("path");

const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

const doNotDelete = "[ ✅ | RECOMMEND]";

// ================= 🔐 SECURITY CONFIG =================
const HELP_PIN = "1989";
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 5 * 60 * 1000;
const SESSION_TIME = 5 * 60 * 1000;

const helpSecurity = global.helpSecurity || (global.helpSecurity = {
	attempts: {},
	lockUntil: {},
	session: {}
});

module.exports = {
	config: {
		name: "help",
		version: "3.0",
		author: "NTKhang + Modified",
		countDown: 5,
		role: 0,
		description: {
			en: "Help Center (PIN Protected)"
		},
		category: "info",
		priority: 1
	},

	onStart: async function ({ message, args, event, role }) {

		const prefix = getPrefix(event.threadID);
		const userID = event.senderID;
		const now = Date.now();

		// ================= 🔐 PIN SYSTEM =================
		if (helpSecurity.lockUntil[userID] && now < helpSecurity.lockUntil[userID]) {
			const remaining = Math.ceil((helpSecurity.lockUntil[userID] - now) / 1000);
			return message.reply(`⛔ You are locked!\nTry again in ${remaining} seconds.`);
		}

		if (!(helpSecurity.session[userID] && now < helpSecurity.session[userID])) {

			const inputPin = args[0];

			if (!inputPin)
				return message.reply("🔐 Enter 4-digit PIN to access Help:\nExample:\nhelp 1989");

			if (inputPin !== HELP_PIN) {

				helpSecurity.attempts[userID] = (helpSecurity.attempts[userID] || 0) + 1;

				if (helpSecurity.attempts[userID] >= MAX_ATTEMPTS) {
					helpSecurity.lockUntil[userID] = now + LOCK_TIME;
					helpSecurity.attempts[userID] = 0;
					return message.reply("⛔ Too many wrong attempts!\nYou are locked for 5 minutes.");
				}

				return message.reply(`❌ Incorrect PIN!\nAttempts: ${helpSecurity.attempts[userID]}/${MAX_ATTEMPTS}`);
			}

			helpSecurity.attempts[userID] = 0;
			helpSecurity.session[userID] = now + SESSION_TIME;

			await message.reply("✅ PASSWORD CONFIRMED\n🏢 Welcome to Help Center V3");
			args.shift();
		}

		// ================= 🏢 HELP CENTER COMMANDS =================

		const subCommand = (args[0] || "").toLowerCase();

		// 📜 RULES
		if (subCommand === "rules") {
			return message.reply(
`📜 HELP CENTER RULES

1. Do not spam commands
2. Do not abuse admin powers
3. Respect all members
4. No hacking attempts
5. Follow bot instructions

Breaking rules may result in ban.

${doNotDelete}`
			);
		}

		// 🔑 FORGOT PASSWORD
		if (subCommand === "forgot") {
			return message.reply(
`🔑 FORGOT PASSWORD?

Please contact Admin to reset your PIN.

Use:
${prefix}help adminrequest

Security Notice:
PIN cannot be recovered automatically.`
			);
		}

		// 👑 ADMIN REQUEST
		if (subCommand === "adminrequest") {
			return message.reply(
`👑 ADMIN REQUEST CENTER

To request admin access:

1. Be active member
2. Follow all rules
3. No violations record

Send request directly to group admin.

Status: Pending manual approval.`
			);
		}

		// 🏢 HELP CENTER MENU
		if (subCommand === "center") {
			return message.reply(
`🏢 HELP CENTER MENU

📜 ${prefix}help rules
🔑 ${prefix}help forgot
👑 ${prefix}help adminrequest
📰 ${prefix}help (view commands)

System Status: Online
Security: Active
${doNotDelete}`
			);
		}

		// ================= 📰 RECOMMENDED NEWS V2 =================

		const page = parseInt(args[0]) || 1;
		const numberOfOnePage = 8;

		const arrayInfo = [];

		for (const [name, value] of commands) {
			if (value.config.role > 1 && role < value.config.role)
				continue;

			arrayInfo.push({
				name,
				category: value.config.category || "others",
				priority: value.priority || 0
			});
		}

		arrayInfo.sort((a, b) => b.priority - a.priority);

		const totalPage = Math.ceil(arrayInfo.length / numberOfOnePage);

		if (page < 1 || page > totalPage)
			return message.reply(`❌ Page ${page} does not exist`);

		const start = (page - 1) * numberOfOnePage;
		const pageData = arrayInfo.slice(start, start + numberOfOnePage);

		let msg = `╭━━━〔 📰 RECOMMENDED NEWS V2 〕━━━⬣\n`;
		msg += `┃ 🔥 Featured Commands\n`;
		msg += `┣━━━━━━━━━━━━━━━━━━⬣\n`;

		pageData.forEach((cmd, index) => {
			msg += `┃ ${start + index + 1}. ⚡ ${cmd.name.toUpperCase()}\n`;
			msg += `┃    📂 ${cmd.category}\n`;
			msg += `┣━━━━━━━━━━━━━━━━━━⬣\n`;
		});

		msg += `┃ 📄 Page: ${page}/${totalPage}\n`;
		msg += `┃ 🤖 Total Commands: ${commands.size}\n`;
		msg += `┃ 🏢 Type ${prefix}help center\n`;
		msg += `╰━━━━━━━━━━━━━━━━━━⬣\n`;
		msg += `\n${doNotDelete}`;

		return message.reply(msg);
	}
};
