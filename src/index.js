require("dotenv").config();

const { Client, Intents, Collection } = require("discord.js");
const path = require("node:path");
const fs = require("fs");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

console.log("Bot is starting...");

const token = process.env.TOKEN;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

///-----------------------------------------------------------------------------------------------------------------
// ping-pong
///-----------------------------------------------------------------------------------------------------------------


// Load banned users data from JSON file, or create an empty object if the file doesn't exist
let bannedUsersData = {};
try {
  const data = fs.readFileSync('bannedUsers.json', 'utf8');
  bannedUsersData = JSON.parse(data);
} catch (err) {
  console.error('Error reading or parsing bannedUsers.json:', err);
}

const pingCommand = "ping"; // Change this to your desired command name
const maxPingAttempts = 5; // Maximum number of allowed pings before temporary ban
const pingCooldownTime = 60 * 1000; // 60 seconds in milliseconds
const temporaryBanTime = 3600 * 1000; // 1 hour in milliseconds
const allowedChannelId = "1145799722800517233"; // Channel ID of allowed channel

// Create a Map to store user ping attempts and timestamps
const pingAttempts = new Map();

client.on("message", async (message) => {
  if (message.author.bot) {
    return; // Ignore messages from bots
  }

  // Check if the message was sent in the allowed channel
  if (message.channel.id !== allowedChannelId && message.content.startsWith("!")) {
    return; // Ignore messages from other channels if they start with "!"
  }

  if (message.content.startsWith("!")) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log("Received command:", command);

    if (command === pingCommand) {
      const userId = message.author.id;
      const now = Date.now();

      // Check if the user is banned
      if (bannedUsersData[userId] && now < bannedUsersData[userId].unbanAt) {
        // User is banned, prevent them from using the ping command
        return;
      }

      // Check if the user has exceeded the maximum ping attempts in the cooldown window
      const userPingAttempts = pingAttempts.get(userId) || [];

      // Remove previous ping attempts that are older than the cooldown time
      const currentTime = Date.now();
      const filteredPingAttempts = userPingAttempts.filter((timestamp) => currentTime - timestamp <= pingCooldownTime);

      if (filteredPingAttempts.length >= maxPingAttempts) {
        // User has exceeded the maximum attempts within the cooldown window, temporarily ban them
        pingAttempts.delete(userId);

        // Store the ban information in the JSON file
        bannedUsersData[userId] = {
          bannedAt: now,
          unbanAt: now + temporaryBanTime,
        };

        fs.writeFileSync('bannedUsers.json', JSON.stringify(bannedUsersData, null, 2));

        message.reply(`You are temporarily banned from using the ${pingCommand} command for 1 hour.`);

        setTimeout(() => {
          delete bannedUsersData[userId];
          fs.writeFileSync('bannedUsers.json', JSON.stringify(bannedUsersData, null, 2));
        }, temporaryBanTime);
      } else {
        // User hasn't exceeded the maximum attempts within the cooldown window, allow the ping
        pingAttempts.set(userId, [...filteredPingAttempts, now]);

        const pingMsg = await message.reply(`Pinging ${message.author}...`);
        const latency = pingMsg.createdTimestamp - message.createdTimestamp;
        pingMsg.edit(`Pong! ${message.author} Latency is ${latency}ms.`);
      }
    }
  }
});

// Check for and remove expired bans on bot startup
const now = Date.now();
for (const userId in bannedUsersData) {
  if (now >= bannedUsersData[userId].unbanAt) {
    delete bannedUsersData[userId];
  }
}
fs.writeFileSync('bannedUsers.json', JSON.stringify(bannedUsersData, null, 2));

///-----------------------------------------------------------------------------------------------------------------
// reaction roles
///-----------------------------------------------------------------------------------------------------------------

// Reaction Roles Section

// IDs of roles and corresponding emojis
const roleEmojis = {
  "1️⃣": "1144693268815294576",
  "2️⃣": "1144693449375895694",
  "3️⃣": "1144693517730467900",
  "4️⃣": "1144693570759037038",
  "👌": "1090440833909674004",
  "😑": "1090440877685624913",
  "✝": "1090440928562516018",
  // Add more emojis and role IDs as needed
};

const sentMessages = new Map(); // Map to store sent messages for reaction roles

client.on("message", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_") {
    const reactionRolesMessage = "Select your Section and language!\n\n" +
      "Section 1 - :one:\n" +
      "Section 2 - :two:\n" +
      "Section 3 - :three:\n" +
      "Section 4 - :four:\n" +
      "Spanish - 👌\n" +
      "French - 😑\n" +
      "Latin - :cross:";

    const sentMessage = await message.channel.send(reactionRolesMessage);

    for (const emoji in roleEmojis) {
      await sentMessage.react(emoji);
    }

    sentMessages.set(sentMessage.id, roleEmojis); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.add(role);
      console.log(`Added role ${role.name} to ${user.tag}`);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.remove(role);
      console.log(`Removed role ${role.name} from ${user.tag}`);
    }
  }
})

///--------------------------------------------------------------------------- SEPARATOR ---------

const reactionRoleData = [
  {
    emoji: '🥽',
    roleId: '1148422548242055229',
    text: 'Swimming',
  },
  {
    emoji: '🏀',
    roleId: '1148422717264121926',
    text: 'Basketball',
  },
  {
    emoji: '🏈',
    roleId: '1148422774872887482',
    text: 'Football',
  },
  {
    emoji: '⚾',
    roleId: '1149466763625500682',
    text: 'Baseball',
  },
  {
    emoji: '⚽',
    roleId: '1148422828572540958',
    text: 'Soccer',
  },
  {
    emoji: '🎾',
    roleId: '1148422873288032332',
    text: 'Tennis',
  },
  {
    emoji: '⛳',
    roleId: '1148424098477781032',
    text: 'Golf',
  },
  {
    emoji: '🏐',
    roleId: '1148424210075619388',
    text: 'Volleyball',
  },
  {
    emoji: '😅',
    roleId: '1148423427674357760',
    text: 'Spikeball sweat',
  },
  {
    emoji: '🤪',
    roleId: '1148422916439035934',
    text: 'Dance',
  },
  {
    emoji: '🥊',
    roleId: '1149295509316575283',
    text: 'Boxxing/Wrestling',
  },
  {
    emoji: '🏓',
    roleId: '1149295984111788052',
    text: 'Ping Pong',
  },
  {
    emoji: '♟',
    roleId: '1148422968012197948',
    text: 'Chess',
  },
  {
    emoji: '➗',
    roleId: '1148423247692582992',
    text: 'Math',
  },
  {
    emoji: '📚',
    roleId: '1148423295469895790',
    text: 'ELA',
  },
  {
    emoji: '🗿',
    roleId: '1152063203833032765',
    text: 'History',
  },
  {
    emoji: '😐',
    roleId: '1148423328915259434',
    text: 'Biology',
  },
  {
    emoji: '😳',
    roleId: '1148423368857624576',
    text: 'Fusion Nerd',
  },
  {
    emoji: '🖥',
    roleId: '1148423619639251027',
    text: 'Tech savvy',
  },
  {
    emoji: '🎶',
    roleId: '1148426631791247461',
    text: 'Music Lovers',
  },
];

client.on('message', async (message) => {
  if (message.content.toLowerCase() === '!sendrolesmessage2_') {
    const reactionRolesMessage = 'Select your roles:\n\n' +
      reactionRoleData.map((data) => `${data.emoji} - ${data.text}`).join('\n');

    const sentMessage = await message.channel.send(reactionRolesMessage);

    for (const data of reactionRoleData) {
      await sentMessage.react(data.emoji);
    }
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  for (const data of reactionRoleData) {
    if (reaction.emoji.name === data.emoji) {
      const guild = reaction.message.guild;
      const role = guild.roles.cache.get(data.roleId);
      const member = guild.members.cache.get(user.id);

      if (role && member) {
        await member.roles.add(role);
        console.log(`Added role ${role.name} to ${user.tag}`);
      }
    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  for (const data of reactionRoleData) {
    if (reaction.emoji.name === data.emoji) {
      const guild = reaction.message.guild;
      const role = guild.roles.cache.get(data.roleId);
      const member = guild.members.cache.get(user.id);

      if (role && member) {
        await member.roles.remove(role);
        console.log(`Removed role ${role.name} from ${user.tag}`);
      }
    }
  }
});

///--------------------------------------------------------------------------- SEPARATOR ---------

const reactionRoleData2 = [
  {
    emoji: '✅',
    roleId: '1151721467646591028',
    text: 'Daily Poll',
  },
  {
    emoji: '🆘',
    roleId: '1145722058509140099',
    text: 'Helper',
  },
];

client.on('message', async (message) => {
  if (message.content.toLowerCase() === '!sendrolesmessage3_') {
    const reactionRolesMessage = 'Select your roles:\n\n' +
      reactionRoleData2.map((data) => `${data.emoji} - ${data.text}`).join('\n');

    const sentMessage = await message.channel.send(reactionRolesMessage);

    for (const data of reactionRoleData2) {
      await sentMessage.react(data.emoji);
    }
  }
});

const userReactionMap = new Map(); // Map to track user reactions

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  const data = reactionRoleData2.find((data) => reaction.emoji.name === data.emoji);
  if (data) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(data.roleId);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      // Check if the user has a previous reaction on this message
      if (userReactionMap.has(reaction.message.id)) {
        const previousReaction = userReactionMap.get(reaction.message.id);
        const previousReactionUser = previousReaction.users.cache.get(user.id);

        if (previousReactionUser) {
          await reaction.message.reactions.cache.get(previousReaction.emoji.name).users.remove(user);
        }
      }

      await member.roles.add(role);
      userReactionMap.set(reaction.message.id, reaction);
      console.log(`Added role ${role.name} to ${user.tag}`);
    }
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  const data = reactionRoleData2.find((data) => reaction.emoji.name === data.emoji);
  if (data) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(data.roleId);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      // Check if the user still has the role before removing it
      if (userReactionMap.has(reaction.message.id) && userReactionMap.get(reaction.message.id).emoji.name === reaction.emoji.name) {
        await member.roles.remove(role);
        userReactionMap.delete(reaction.message.id);
        console.log(`Removed role ${role.name} from ${user.tag}`);
      }
    }
  }
});

///-----------------------------------------------------------------------------------------------------------------
// welcome message
///-----------------------------------------------------------------------------------------------------------------

client.on("guildMemberAdd", (member) => {
  const welcomeChannelID = "1090439603955187782"; // <<--- channel ID

  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelID);

  if (welcomeChannel) {
    welcomeChannel.send(`:tada: :partying_face: :tada:   Welcome to the server, ${member.user.username}! Enjoy your time here :).`);
  }
});

///-----------------------------------------------------------------------------------------------------------------
// birthdays
///-----------------------------------------------------------------------------------------------------------------

const birthdayFilePath = "birthdays.json";
let birthdays = {};

// Load birthdays from file
if (fs.existsSync(birthdayFilePath)) {
  birthdays = JSON.parse(fs.readFileSync(birthdayFilePath, "utf8"));
}

client.on("message", (message) => {
  // Command to set a user's birthday: !setbirthday YYYY-MM-DD
  if (message.content.startsWith("!setbirthday")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      return message.reply('Do "!setbirthday YYYY-MM-DD"');
    }

    const userId = message.author.id;
    const birthday = args[1];
    birthdays[userId] = birthday;
    fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
    return message.reply(`Birthday set for you on ${birthday}.`);
  }
});

// Check for birthdays and announce
setInterval(() => {
  const today = new Date().toISOString().substr(5, 5);
  for (const userId in birthdays) {
    const user = client.users.cache.get(userId);
    if (!user) {
      delete birthdays[userId];
      fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
      continue;
    }

    if (birthdays[userId] === today) {
      const birthdayChannel = client.channels.cache.get("1146210030027288616");
      if (birthdayChannel) {
        birthdayChannel.send(`🎉 Happy Birthday ${user}! 🎉`);
      }
    }
  }
}, 60000); // Check every minute

// Remove birthday entry when a member leaves
client.on("guildMemberRemove", (member) => {
  delete birthdays[member.user.id];
  fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
});

///-----------------------------------------------------------------------------------------------------------------
// bot status
///-----------------------------------------------------------------------------------------------------------------

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Set the bot's status
  client.user.setPresence({
    //activity: { name: "VALORANT lol", type: "PLAYING" },
    status: "dnd", // "online", "idle", "dnd", or "invisible"
  });
});

///-----------------------------------------------------------------------------------------------------------------
// bot token
///-----------------------------------------------------------------------------------------------------------------

console.log("Bot is still starting...");
//console.log(token)
client.login(token);
console.log("Bot has started!")
