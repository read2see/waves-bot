const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete-previous-messages')
		.setDescription('Delete a set amount of recent bot\'s messages.')
        .addIntegerOption( option =>
                option.setName('amount')
                .setDescription('The amount of posts to delete.')
                .setRequired(true)
                .setChoices(
                    { name: '1', value: 1 },
                    { name: '2', value: 2 },
                    { name: '3', value: 3 },
                    { name: '4', value: 4 },
                    { name: '5', value: 5 },
                    { name: '6', value: 6 },
                    { name: '7', value: 7 },
                )
            ),
	async execute(interaction) {
		await interaction.reply({content: 'The messages died on the beach.', ephemeral: true});
        const botUser = interaction.client.user;
        if(interaction.options.getInteger('amount')){
            (await interaction.channel.messages.fetch({ limit: 20 })).filter(m => m.author.id === botUser.id)
                .delete(
                    interaction.options.getInteger('delete-previous-posts')
                );
        }
	},
};