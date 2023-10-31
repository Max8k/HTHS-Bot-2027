require("dotenv").config();
const fs = require('fs');
const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

console.log("Bot is starting...");

const token = process.env.TOKEN;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

///-----------------------------------------------------------------------------------------------------------------
// slash commands (Ping & Report Commands)
///-----------------------------------------------------------------------------------------------------------------

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = '1144697670246604924';
const TARGET_CHANNEL_ID = '1090990525420687410'; // The channel where /report is allowed
const REPORT_CHANNEL_ID = '1090440202457198592'; // The channel where report notifications are sent

const commands = [
  {
    name: 'ping',
    description: 'Ping the bot',
  },
  {
    name: 'report',
    description: 'Report a user',
    options: [
      {
        name: 'user',
        type: 6, // USER type
        description: 'The user to report',
        required: true,
      },
      {
        name: 'reason',
        type: 3, // STRING type
        description: 'The reason for the report',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(token);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Successfully registered "ping" and "report" commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    const userId = interaction.user.id;

    if (!isCommandAllowedInChannel(interaction.channelId)) {
      await interaction.reply({
        content: 'This command can only be used in the ping-wars channel.',
        ephemeral: true,
      });
      return;
    }

    const pingMsg = await interaction.reply({
      content: `Pinging ${interaction.user}...`,
      fetchReply: true,
    });
    const latency = pingMsg.createdTimestamp - interaction.createdTimestamp;
    await pingMsg.edit(`Pong! ${interaction.user} Latency is ${latency}ms.`);
  } else if (commandName === 'report') {
    if (interaction.channelId !== TARGET_CHANNEL_ID) {
      await interaction.reply({
        content: 'You can only use the /report command in the report channel.',
        ephemeral: true,
      });
      return;
    }

    const userToReport = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!userToReport || !reason) {
      await interaction.reply({
        content: 'Please provide a user and a reason for the report.',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: 'Your report has been submitted.',
      ephemeral: true,
    });

    const reportChannel = client.channels.cache.get(REPORT_CHANNEL_ID);

    if (reportChannel) {
      reportChannel.send(`${userToReport} has been reported for: "${reason}" by ${interaction.user}`);
    }
  }
});

// Function to check if the command is allowed in the channel
function isCommandAllowedInChannel(channelId) {
  return channelId === '1145799722800517233';
}

///-----------------------------------------------------------------------------------------------------------------
// reaction roles
///-----------------------------------------------------------------------------------------------------------------

const roleEmojis_section = {
  "1️⃣": "1144693268815294576",
  "2️⃣": "1144693449375895694",
  "3️⃣": "1144693517730467900",
  "4️⃣": "1144693570759037038",
};

const sentMessages_section = new Map(); // Map to store sent messages for reaction roles

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_section") {
    const reactionRolesMessage_section = "Select your section!\n\n" +
      "Section 1 - 1️⃣\n" +
      "Section 2 - 2️⃣\n" +
      "Section 3 - 3️⃣\n" +
      "Section 4 - 4️⃣\n";

    const sentMessage = await message.channel.send(reactionRolesMessage_section);

    for (const emoji in roleEmojis_section) {
      await sentMessage.react(emoji);
    }

    sentMessages_section.set(sentMessage.id, roleEmojis_section); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_section.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.add(role);
      //console.log(`Added role ${role.name} to ${user.tag}`);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_section.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.remove(role);
      //console.log(`Removed role ${role.name} from ${user.tag}`);
    }
  }
});

///--------------------------------------------------------------------------- SEPARATOR ---------

const roleEmojis_language = {
  "👌": "1090440833909674004",
  "😑": "1090440877685624913",
  "✝": "1090440928562516018",
};

const sentMessages_language = new Map(); // Map to store sent messages for reaction roles

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_language") {
    const reactionRolesMessage_language = "Select your language!\n\n" +
      "Spanish - 👌\n" +
      "French - 😑\n" +
      "Latin - :cross:";

    const sentMessage = await message.channel.send(reactionRolesMessage_language);

    for (const emoji in roleEmojis_language) {
      await sentMessage.react(emoji);
    }

    sentMessages_language.set(sentMessage.id, roleEmojis_language); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_language.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = await guild.members.fetch(user.id);

    if (role && member) {
      await member.roles.add(role);
      //console.log(`Added role ${role.name} to ${user.tag}`);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_language.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = await guild.members.fetch(user.id);

    if (role && member) {
      await member.roles.remove(role);
      //console.log(`Removed role ${role.name} from ${user.tag}`);
    }
  }
});

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
    text: 'Boxing/Wrestling',
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

client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '!sendrolesmessage_hobbies') {
    const reactionRolesMessage = 'Select your roles!\n\n' +
      reactionRoleData.map((data) => `${data.emoji} - ${data.text}`).join('\n');

    const sentMessage = await message.channel.send({ content: reactionRolesMessage });

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
        await member.roles.add([role]);
        // console.log(`Added role ${role.name} to ${user.tag}`);
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
        await member.roles.remove([role]);
        // console.log(`Removed role ${role.name} from ${user.tag}`);
      }
    }
  }
});

///--------------------------------------------------------------------------- SEPARATOR ---------

const roleEmojis_ya = {
  "🆘": "1145722058509140099",
  "✅": "1151721467646591028",
};

const sentMessages_ya = new Map(); // Map to store sent messages for reaction roles

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_ya") {
    const reactionRolesMessage = "Select your roles!\n\n" +
      "Helper - 🆘\n" +
      "Daily Poll - ✅";

    const sentMessage = await message.channel.send({ content: reactionRolesMessage });

    for (const emoji in roleEmojis_ya) {
      await sentMessage.react(emoji);
    }

    sentMessages_ya.set(sentMessage.id, roleEmojis_ya); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_ya.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.add([role]);
      //console.log(`Added role ${role.name} to ${user.tag}`);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_ya.get(reaction.message.id)?.[reaction.emoji.name];
  if (roleID) {
    const guild = reaction.message.guild;
    const role = guild.roles.cache.get(roleID);
    const member = guild.members.cache.get(user.id);

    if (role && member) {
      await member.roles.remove([role]);
      //console.log(`Removed role ${role.name} from ${user.tag}`);
    }
  }
});

///-----------------------------------------------------------------------------------------------------------------
// Welcome Message
///-----------------------------------------------------------------------------------------------------------------

client.on("guildMemberAdd", (member) => {
  const welcomeChannelID = "1090439603955187782";

  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelID);

  if (welcomeChannel) {
    welcomeChannel.send(`:tada: :partying_face: :tada:   Welcome to the server, ${member.user.username}! Enjoy your time here :).`);
  }
});

///-----------------------------------------------------------------------------------------------------------------
// Birthdays
///-----------------------------------------------------------------------------------------------------------------
/*
const birthdayFilePath = "birthdays.json";
let birthdays = {};

// Load birthdays from file
if (fs.existsSync(birthdayFilePath)) {
  birthdays = JSON.parse(fs.readFileSync(birthdayFilePath, "utf8"));
}

client.on("messageCreate", (message) => {
  // Command to set a user's birthday: !setbirthday MM-DD-YYYY
  if (message.content.startsWith("!setbirthday")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      return message.reply('Do "!setbirthday MM-DD-YYYY"');
    }

    const userId = message.author.id;
    const birthday = args[1];

    // Validate the input date
    if (!isValidDate(birthday)) {
      return message.reply('Invalid date format. Please use "!setbirthday MM-DD-YYYY" with a valid date.');
    }

    birthdays[userId] = birthday;
    fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));

    // Calculate age and upcoming birthday date
    const today = new Date();
    const birthDate = new Date(birthday);
    const upcomingBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 8, 0, 0, 0);

    // Check if the birthday has already passed this year, if so, set it for next year
    if (today > upcomingBirthday) {
      upcomingBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Calculate days until the upcoming birthday
    const oneDay = 1000 * 60 * 60 * 24; // Milliseconds in a day
    const age = upcomingBirthday.getFullYear() - birthDate.getFullYear();
    const daysUntilBirthday = Math.ceil((upcomingBirthday - today) / oneDay);

    // Format the upcoming birthday date as MM-DD-YYYY
    const formattedUpcomingBirthday = `${upcomingBirthday.getMonth() + 1}-${upcomingBirthday.getDate()}-${upcomingBirthday.getFullYear()}`;

    return message.reply(`Birthday set for you on ${birthday}. Your ${age}th Birthday will be announced on ${formattedUpcomingBirthday}, ${daysUntilBirthday} days to go!`);
  }
});

// Announce birthdays at 8 AM EST in a specific channel
setInterval(() => {
  const now = new Date();
  const estOffset = -5; // Eastern Standard Time (EST) offset in hours
  now.setUTCHours(now.getUTCHours() + estOffset, 8, 0, 0);
  const today = now.toISOString().substr(5, 5);
  const birthdayChannelId = "1146210030027288616"; // Replace with your birthday channel ID

  const birthdayChannel = client.channels.cache.get(birthdayChannelId);
  if (!birthdayChannel) {
    console.error(`Birthday channel with ID ${birthdayChannelId} not found.`);
    return;
  }

  for (const userId in birthdays) {
    const user = client.users.cache.get(userId);
    if (!user) {
      delete birthdays[userId];
      fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
      continue;
    }

    if (birthdays[userId] === today) {
      birthdayChannel.send(`🎉 Happy Birthday ${user}! 🎉`);
    }
  }
}, 1000 * 60 * 60 * 24); // Check every 24 hours

// Remove birthday entry when a member leaves
client.on("guildMemberRemove", (member) => {
  delete birthdays[member.user.id];
  fs.writeFileSync(birthdayFilePath, JSON.stringify(birthdays, null, 2));
});

// Function to validate a date string (MM-DD-YYYY format)
function isValidDate(dateString) {
  const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
*/
///-----------------------------------------------------------------------------------------------------------------
// Remote Shutdown
///-----------------------------------------------------------------------------------------------------------------

const ownerId = '789606702076788737';

client.on('messageCreate', (message) => {
    if (message.author.id === ownerId && message.content === '!disconnect') {
        message.channel.send('Disconnecting...').then(() => {
            console.log('Recieved Command: Disconnect')
            client.destroy(); // Disconnect the bot
        });
    }
});

///-----------------------------------------------------------------------------------------------------------------
// Bot Status
///-----------------------------------------------------------------------------------------------------------------

client.once('ready', () => {
  client.user.setPresence({
    activities: [{ name: '/Report?', type: 'PLAYING' }],
    status: 'idle', // "online", "idle", "dnd", or "invisible"
  });
});

///-----------------------------------------------------------------------------------------------------------------
// Bot Token
///-----------------------------------------------------------------------------------------------------------------

console.log("Bot is still starting...");
client.login(token).then(() => {
  console.log("Bot has started!");
}).catch(error => {
  console.error("Error logging in:", error);
});
