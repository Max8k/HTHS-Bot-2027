require("dotenv").config();
const fs = require('fs');
const {Client, MessageEmbed, Intents} = require("discord.js")

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, // Required for guild-related events (e.g., guildCreate, guildDelete)
    Intents.FLAGS.GUILD_MESSAGES, // Required for message-related events (e.g., messageCreate, messageDelete)
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS, // Required for reaction-related events (e.g., messageReactionAdd, messageReactionRemove)
    Intents.FLAGS.DIRECT_MESSAGES, // Required for direct message-related events (e.g., messageCreate in DMs)
    Intents.FLAGS.GUILD_MEMBERS, // Required for member-related events (e.g., guildMemberAdd, guildMemberRemove)
    Intents.FLAGS.GUILD_PRESENCES, // Required for presence-related events (e.g., presenceUpdate)
  ],
});

const ownerId = '789606702076788737';
const token = process.env.TOKEN;
const forbiddenWords = require('../forbiddenWords.json');

client.once("ready", () => {
  console.log(`${client.user.tag} online...`);
});

///-----------------------------------------------------------------------------------------------------------------
// slash commands (Ping & Report Commands)
///-----------------------------------------------------------------------------------------------------------------

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = '1144697670246604924';
//const TARGET_CHANNEL_ID = '1090990525420687410'; // The channel where /report is allowed
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
  {
    name: 'help',
    description: 'List of Current Commands',
  },
  {
    name: 'word-filter',
    description: 'Profanity Filter',
    options: [
      {
        name: 'word',
        type: 3, // STRING type
        description: 'Word to filter...',
        required: true,
      },
    ]
  },
];

const rest = new REST({ version: 10 }).setToken(token);

client.once('ready', async () => {
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Successfully registered the application commands.');
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
    /*
    if (interaction.channelId !== TARGET_CHANNEL_ID) {
      await interaction.reply({
        content: 'You can only use the /report command in the report channel.',
        ephemeral: true,
      });
      return;
    }
    */
    const userToReport = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!userToReport || !reason) {
      await interaction.reply({
        content: 'Please provide a user and a VALID reason for the report.',
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
  } else if (commandName === 'help') {
    await interaction.reply({
        content: 'Current Commands: "/ping", "/report", "/help"\n\nIf you have any issues, ping Max8k.',
        ephemeral: true,
    });
  } else if (commandName === 'word-filter') {
    const word = interaction.options.getString('word');
    const contentLowerCase = word.toLowerCase();
    let hasProfanity = false;

    for (let i = 0; i < forbiddenWords.length; i++) {
      const forbiddenWordLowerCase = forbiddenWords[i].toLowerCase();
      if (contentLowerCase.includes(forbiddenWordLowerCase)) {
        hasProfanity = true;
        break; // Break out of the loop if profanity is found
      }
    }

    if (hasProfanity) {
      await interaction.reply({
        content: `The word "${word}" is/contains a profanity, MAY be punishable.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `The word "${word}" doesn't contain a profanity.`,
        ephemeral: true,
      });
    }
  }
});

function isCommandAllowedInChannel(channelId) {
  return channelId === '1145799722800517233'; // ping-wars channel id
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
  if (message.content.toLowerCase() === "!sendrolesmessage_section" && message.author.id === ownerId) {
    message.delete();
    const reactionRolesMessage_section =
      "Select your section:\n\n" +
      "Section 1 - 1️⃣\n" +
      "Section 2 - 2️⃣\n" +
      "Section 3 - 3️⃣\n" +
      "Section 4 - 4️⃣\n";

    const sentMessage_section = await message.channel.send(reactionRolesMessage_section);

    for (const emoji in roleEmojis_section) {
      await sentMessage_section.react(emoji);
    }

    sentMessages_section.set(sentMessage_section.id, roleEmojis_section); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_section.get(reaction.message.id)?.[reaction.emoji.toString()];
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

  const roleID = sentMessages_section.get(reaction.message.id)?.[reaction.emoji.toString()];
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
  if (message.content.toLowerCase() === "!sendrolesmessage_language" && message.author.id === ownerId) {
    message.delete();
    const reactionRolesMessage_language = "\nSelect your language:\n\n" +
      "Spanish - 👌\n" +
      "French - 😑\n" +
      "Latin - :cross:";

    const sentMessage_language = await message.channel.send(reactionRolesMessage_language);

    for (const emoji in roleEmojis_language) {
      await sentMessage_language.react(emoji);
    }

    sentMessages_language.set(sentMessage_language.id, roleEmojis_language); // Store the sent message
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
  if (message.content.toLowerCase() === '!sendrolesmessage_hobbies' && message.author.id === ownerId) {
    message.delete();
    const reactionRolesMessage = '\nSelect your roles:\n\n' +
      reactionRoleData.map((data) => `${data.emoji} - ${data.text}`).join('\n');

    const sentMessage_hobbies = await message.channel.send({ content: reactionRolesMessage });

    for (const data of reactionRoleData) {
      await sentMessage_hobbies.react(data.emoji);
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
        //console.log(`Added role ${role.name} to ${user.tag}`);
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
        //console.log(`Removed role ${role.name} from ${user.tag}`);
      }
    }
  }
});

///--------------------------------------------------------------------------- SEPARATOR ---------

const roleEmojis_more = {
  "🆘": "1145722058509140099",
  "✅": "1151721467646591028",
  "😵": "1184592060796371006",
};

const sentMessages_more = new Map(); // Map to store sent messages for reaction roles

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_more" && message.author.id === ownerId) {
    message.delete();
    const reactionRolesMessage = "\nSelect your roles:\n\n" +
      "Helper - 🆘\n" +
      "Daily Poll - ✅\n" +
      "Pingable - 😵";

    const sentMessage_more = await message.channel.send({ content: reactionRolesMessage });

    for (const emoji in roleEmojis_more) {
      await sentMessage_more.react(emoji);
    }

    sentMessages_more.set(sentMessage_more.id, roleEmojis_more); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_more.get(reaction.message.id)?.[reaction.emoji.name];
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

  const roleID = sentMessages_more.get(reaction.message.id)?.[reaction.emoji.name];
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

///--------------------------------------------------------------------------- SEPARATOR ---------

const roleEmojis_pronouns = {
  "👽": "1154483667826135061",
  "👻": "1154483798482882641",
  "😏": "1154483874756317225",
  "😱": "1154483962576654366",
};

const sentMessages_pronouns = new Map(); // Map to store sent messages for reaction roles

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!sendrolesmessage_pronouns" && message.author.id === ownerId) {
    message.delete();
    const reactionRolesMessage = "\nSelect your pronouns:\n\n" +
      "He/Him - 👽\n" +
      "She/Her - 👻\n" +
      "They/Them - 😏\n" +
      "Other - 😱";

    const sentMessage_pronouns = await message.channel.send({ content: reactionRolesMessage });

    for (const emoji in roleEmojis_pronouns) {
      await sentMessage_pronouns.react(emoji);
    }

    sentMessages_pronouns.set(sentMessage_pronouns.id, roleEmojis_pronouns); // Store the sent message
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  const roleID = sentMessages_pronouns.get(reaction.message.id)?.[reaction.emoji.name];
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

  const roleID = sentMessages_pronouns.get(reaction.message.id)?.[reaction.emoji.name];
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
  const welcomeChannelID = "1090439603955187782"; // Welcome Messages Sent to this channel

  const welcomeChannel = member.guild.channels.cache.get(welcomeChannelID);

  if (welcomeChannel) {
    welcomeChannel.send(`:tada::partying_face::tada:  Welcome to the server, <@${member.id}>! Enjoy your time here :).`);
  }
});

///-----------------------------------------------------------------------------------------------------------------
// Word Filter
///-----------------------------------------------------------------------------------------------------------------

// Only commented because it's annoying for my server members, works 100%...

/*
client.on("messageCreate", async (message) => {
  const contentLowerCase = message.content.toLowerCase(); // Convert message content to lowercase
  for (let i = 0; i < forbiddenWords.length; i++) {
    const forbiddenWordLowerCase = forbiddenWords[i].toLowerCase(); // Convert forbidden word to lowercase
    if (contentLowerCase.includes(forbiddenWordLowerCase)) {
      const embed = new MessageEmbed()
        .setAuthor("Censored Word found")
        .setColor("RED")
        .setDescription(`L Message from ${message.author} has been censored.`);
      try {
        await message.delete();
        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.log(error);
        embed.setColor("DARK_RED");
        embed.setDescription("Missing permissions to delete messages.");
        message.reply({ embeds: [embed] });
      }
      break;
    }
  }
});
*/
///-----------------------------------------------------------------------------------------------------------------
// Remote Shutdown
///-----------------------------------------------------------------------------------------------------------------

client.on('messageCreate', async (message) => {
  if (message.author.id === ownerId && message.content === '!disconnect') {
    try {
      await message.delete();
    } catch (error) {
      console.log(error)
    }
    console.log('Recieved Disconnect Command...')
    client.destroy(); // Disconnect the bot
  }
});

///-----------------------------------------------------------------------------------------------------------------
// Bot Status
///-----------------------------------------------------------------------------------------------------------------

client.once('ready', () => {
  client.user.setPresence({
    activities: [{ name: '/word-check?', type: 'PLAYING' }],
    status: 'dnd', // "online", "idle", "dnd", or "invisible"
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.id === ownerId && message.content === '!update') {
    try {
      await message.delete();
    } catch (error) {
      console.log(error)
    }
    client.user.setPresence({
      activities: [{ name: '/word-check??', type: 'PLAYING' }],
      status: 'dnd', // "online", "idle", "dnd", or "invisible"
    });
    console.log('Recieved Update Command...')
  }
});

///-----------------------------------------------------------------------------------------------------------------
// Bot Token
///-----------------------------------------------------------------------------------------------------------------

client.login(token).then(() => {
  console.log("Bot connected...");
}).catch(error => {
  console.error("Error logging in:", error);
});