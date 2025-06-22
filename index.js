const {
    Client,
    Events,
    GatewayIntentBits,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});
const DISCORD_TOKEN = 'MTM4MzU5NzQxODQxODkzMzgxMA.GfUayJ.9VQYK8_B9kNf1qV6mgzg6DBkux2I2AtqVXgWhg';
const REPORT_CHANNEL_ID = '1379607045761667122';
const DM_CLOSED_CHANNEL_ID = '1379607004615544922';
const REQUIRED_ROLE_ID = '1261430244561260636';
const sentMessages = new Map();
client.once(Events.ClientReady, async c => {
    console.log(`lbot khdam, whadi smiyto: ${c.user.tag}`);
    const command = new SlashCommandBuilder().setName('msg').setDescription('send private message for all members');
    try {
        await client.application.commands.create(command);
        console.log('safi rah /msg khdama');
    } catch (error) {
        console.error('Command registration error:', error);
    }
});
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'msg') {
            if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
                await interaction.reply({ content: 'باقي صغير فاش تكبر اجي جرب', ephemeral: true });
                return;
            }
            const modal = new ModalBuilder().setCustomId('messageModal').setTitle('Send Message');
            const messageInput = new TextInputBuilder().setCustomId('messageInput').setLabel('Ktb hadak L Message li bghiti iwsel L members').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
    } catch (error) { console.error('Error processing command:', error); }
});
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId === 'messageModal') {
            const message = interaction.fields.getTextInputValue('messageInput');
            await interaction.reply({ content: `**L Message li sifti**: ${message}`, ephemeral: true });
            const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID).catch(error => {
                console.error('Error fetching main reporting channel:', error);
                return null;
            });
            const dmClosedChannel = await client.channels.fetch(DM_CLOSED_CHANNEL_ID).catch(error => {
                console.error('Error fetching channel closing DMs:', error);
                return null;
            });
            const embed = new EmbedBuilder().setColor(0x800080).setDescription(`**Message sent to all**\n**By:**\n <@${interaction.user.id}> | ${interaction.user.id}\n\n**Content:**\n${message}`).setTimestamp();
            const editButton = new ButtonBuilder().setCustomId('edit_message').setLabel('edit msg').setStyle(ButtonStyle.Primary);
            const deleteButton = new ButtonBuilder().setCustomId('delete_message').setLabel('delete msg').setStyle(ButtonStyle.Danger);
            const buttonRow = new ActionRowBuilder().addComponents(editButton, deleteButton);
            let reportMessage = null;
            if (reportChannel) {
                reportMessage = await reportChannel.send({ embeds: [embed], components: [buttonRow] });
            }
            const guild = interaction.guild;
            await guild.members.fetch();
            const members = guild.members.cache;
            sentMessages.clear();
            for (const member of members.values()) {
                if (member.user.bot) continue;
                try {
                    const sentMessage = await member.send(message);
                    sentMessages.set(member.user.id, sentMessage.id);
                    console.log(`The message was sent to: ${member.user.tag}`)
                } catch (error) {
                    if (error.code === 50007) {
                        if (dmClosedChannel) {
                            await dmClosedChannel.send(`<@${member.user.id}> Ymken tafi (DMs off)`);
                        }
                        console.log(`${member.user.tag}: Ymken tafi (DMs off)`);
                    } else { console.error(`Error sending message to${member.user.tag}:`, error); }
                }
            }
        }
    } catch (error) { console.error('Window processing error:', error); }
});
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isButton()) return;
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) { await interaction.reply({ content: 'باقي صغير فاش تكبر اجي جرب', ephemeral: true }); return; }
        if (interaction.customId === 'edit_message') {
            const modal = new ModalBuilder().setCustomId('editMessageModal').setTitle('Edit Message');
            const messageInput = new TextInputBuilder().setCustomId('editMessageInput').setLabel('Ktb L Message L jdid').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'delete_message') {
            const guild = interaction.guild;
            await guild.members.fetch();
            const members = guild.members.cache;
            for (const [userId, messageId] of sentMessages) {
                try {
                    const member = members.get(userId);
                    if (member) {
                        const dmChannel = await member.createDM();
                        await dmChannel.messages.delete(messageId).catch(error => {
                            console.error(`Error deleting message from${member.user.tag}:`, error);
                        });
                    }
                } catch (error) { console.error(`Error deleting message from${userId}:`, error); }
            }
            const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID).catch(error => { console.error('Error fetching reporting channel:', error); return null; });
            if (reportChannel && interaction.message) {
                const embed = interaction.message.embeds[0];
                const newEmbed = new EmbedBuilder(embed)
                    .setDescription(`${embed.description}\n\nMessage removed by:\n<@${interaction.user.id}> | ${interaction.user.id}`)
                    .setTimestamp();
                await interaction.message.edit({ embeds: [newEmbed], components: [] });
            }
            await interaction.reply({ content: 'SAFI message tms7 men 3nd kolchi kon hani :)', ephemeral: true });
            sentMessages.clear();
        }
    } catch (error) {
        console.error('Error processing buttons:', error);
    }
});
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId === 'editMessageModal') {
            const newMessage = interaction.fields.getTextInputValue('editMessageInput');
            await interaction.reply({ content: `**L Message L jdid li sifti**: ${newMessage}`, ephemeral: true });
            const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID).catch(error => {
                console.error('Error fetching reporting channel:', error);
                return null;
            });
            const dmClosedChannel = await client.channels.fetch(DM_CLOSED_CHANNEL_ID).catch(error => { console.error('Error fetching channel closing DMs:', error); return null; });
            if (reportChannel && interaction.message) {
                const embed = interaction.message.embeds[0];
                const newEmbed = new EmbedBuilder().setColor(0x800080).setDescription(`Message sent to all\nBy: <@${interaction.user.id}> | ${interaction.user.id}\n\nContent:\n${newMessage}`).setTimestamp();
                const editButton = new ButtonBuilder().setCustomId('edit_message').setLabel('edit msg').setStyle(ButtonStyle.Primary);
                const deleteButton = new ButtonBuilder().setCustomId('delete_message').setLabel('delete msg').setStyle(ButtonStyle.Danger);
                const buttonRow = new ActionRowBuilder().addComponents(editButton, deleteButton);
                await interaction.message.edit({ embeds: [newEmbed], components: [buttonRow] });
            }
            const guild = interaction.guild;
            await guild.members.fetch();
            const members = guild.members.cache;
            for (const [userId, messageId] of sentMessages) {
                try {
                    const member = members.get(userId);
                    if (member) {
                        const dmChannel = await member.createDM();
                        const message = await dmChannel.messages.fetch(messageId).catch(() => null);
                        if (message) {
                            await message.edit(newMessage);
                            console.log(`The message has been modified to: ${member.user.tag}`);
                        } else {
                            const sentMessage = await member.send(newMessage);
                            sentMessages.set(userId, sentMessage.id);
                            console.log(`A new message has been sent to: ${member.user.tag}`);
                        }
                    }
                } catch (error) {
                    if (error.code === 50007) {
                        if (dmClosedChannel) { await dmClosedChannel.send(`<@${userId}> Ymken tafi (DMs off)`); }
                        console.log(`${userId}: Ymken tafi (DMs off)`);
                    } else { console.error(`Error editing message for ${userId}:`, error); }
                }
            }
        }
    } catch (error) { console.error('Error processing window modification:', error); }
});
client.login('').catch(error => { console.error('Registration error:', error); });
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isButton()) return;
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) { await interaction.reply({ content: 'باقي صغير فاش تكبر اجي جرب', ephemeral: true }); return; }
        if (interaction.customId === 'edit_message') {
            const modal = new ModalBuilder().setCustomId('editMessageModal').setTitle('Edit Message');
            const messageInput = new TextInputBuilder().setCustomId('editMessageInput').setLabel('Ktb L Message L jdid').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'delete_message') {
            const guild = interaction.guild;
            await guild.members.fetch();
            const members = guild.members.cache;
            for (const [userId, messageId] of sentMessages) {
                try {
                    const member = members.get(userId);
                    if (member) {
                        const dmChannel = await member.createDM();
                        await dmChannel.messages.delete(messageId).catch(error => {
                            console.error(`Error deleting message from${member.user.tag}:`, error);
                        });
                    }
                } catch (error) { console.error(`Error deleting message from${userId}:`, error); }
            }
            const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID).catch(error => { console.error('Error fetching reporting channel:', error); return null; });
            if (reportChannel && interaction.message) {
                const embed = interaction.message.embeds[0];
                const newEmbed = new EmbedBuilder(embed)
                    .setDescription(`${embed.description}\n\nMessage removed by:\n<@${interaction.user.id}> | ${interaction.user.id}`)
                    .setTimestamp();
                await interaction.message.edit({ embeds: [newEmbed], components: [] });
            }
            await interaction.reply({ content: 'SAFI message tms7 men 3nd kolchi kon hani :)', ephemeral: true });
            sentMessages.clear();
        }
    } catch (error) {
        console.error('Error processing buttons:', error);
    }
});
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId === 'editMessageModal') {
            const newMessage = interaction.fields.getTextInputValue('editMessageInput');
            await interaction.reply({ content: `**L Message L jdid li sifti**: ${newMessage}`, ephemeral: true });
            const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID).catch(error => {
                console.error('Error fetching reporting channel:', error);
                return null;
            });
            const dmClosedChannel = await client.channels.fetch(DM_CLOSED_CHANNEL_ID).catch(error => { console.error('Error fetching channel closing DMs:', error); return null; });
            if (reportChannel && interaction.message) {
                const embed = interaction.message.embeds[0];
                const newEmbed = new EmbedBuilder().setColor(0x800080).setDescription(`Message sent to all\nBy: <@${interaction.user.id}> | ${interaction.user.id}\n\nContent:\n${newMessage}`).setTimestamp();
                const editButton = new ButtonBuilder().setCustomId('edit_message').setLabel('edit msg').setStyle(ButtonStyle.Primary);
                const deleteButton = new ButtonBuilder().setCustomId('delete_message').setLabel('delete msg').setStyle(ButtonStyle.Danger);
                const buttonRow = new ActionRowBuilder().addComponents(editButton, deleteButton);
                await interaction.message.edit({ embeds: [newEmbed], components: [buttonRow] });
            }
            const guild = interaction.guild;
            await guild.members.fetch();
            const members = guild.members.cache;
            for (const [userId, messageId] of sentMessages) {
                try {
                    const member = members.get(userId);
                    if (member) {
                        const dmChannel = await member.createDM();
                        const message = await dmChannel.messages.fetch(messageId).catch(() => null);
                        if (message) {
                            await message.edit(newMessage);
                            console.log(`The message has been modified to: ${member.user.tag}`);
                        } else {
                            const sentMessage = await member.send(newMessage);
                            sentMessages.set(userId, sentMessage.id);
                            console.log(`A new message has been sent to: ${member.user.tag}`);
                        }
                    }
                } catch (error) {
                    if (error.code === 50007) {
                        if (dmClosedChannel) { await dmClosedChannel.send(`<@${userId}> Ymken tafi (DMs off)`); }
                        console.log(`${userId}: Ymken tafi (DMs off)`);
                    } else { console.error(`Error editing message for ${userId}:`, error); }
                }
            }
        }
    } catch (error) { console.error('Error processing window modification:', error); }
});
client.login('MTM4MzU5NzQxODQxODkzMzgxMA.GfUayJ.9VQYK8_B9kNf1qV6mgzg6DBkux2I2AtqVXgWhg').catch(error => { console.error('Registration error:', error); });