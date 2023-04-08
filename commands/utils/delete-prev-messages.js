const { SlashCommandBuilder } = require('discord.js');

const COOL_DDOWN = 1800;
module.exports = {
    cooldown: COOL_DDOWN,
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
        const amount = interaction.options.getInteger('amount');
        const botUser = interaction.client.user;
        await interaction.deferReply({ephemeral: true});
        if(amount){
            let toDelete =  (await interaction.channel.messages.fetch({ limit: 20 })).filter(m => m.author.id === botUser.id).sort((a, b) => b.createdTimestamp - a.createdTimestamp );
            for(let i = 0; i < amount; i++){
                if(toDelete.at(i)){
                    toDelete.at(i).delete();
                }else{
                    break;
                }
            }
        }
        await interaction.editReply({content: `${amount} message(s) died on the beach.`});
	},
};