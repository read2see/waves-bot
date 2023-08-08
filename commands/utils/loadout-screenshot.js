const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const COOL_DDOWN = 30;
const DEFAULT_COMPLETION_MESSAGE = 'Loadout Screenshot:';

module.exports = {
	cooldown: COOL_DDOWN,
	data: new SlashCommandBuilder()
		.setName('loadout-screenshot')
		.setDescription('Retrieve a loadout\'s screenshot.')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to reply at. defaults to current channel.')
		)
		.addStringOption( option => 
			option.setName('on-completion')
			.setDescription('Set custom completion message.')
		)
		.addBooleanOption(option =>
			option.setName('visible-only-to-me')
			.setDescription('Set the bots message visibility to yourself alone.')
		)
        .addStringOption( option => 
			option.setName('loadout-id')
			.setDescription('The loadout\'s ID to be retrieved.')
		)
		,
	async execute(interaction) {
		await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});

		let imageAttachments = [];

        console.log('Requesting loadout\'s screenshot option...');
      if(interaction.options.getString('loadout-id')){
            let response = await fetch('https://gotlegends.info/community-builds/loadout-screenshot?loadout_id='+ interaction.options.getString('loadout-id'));
		    let data = await response.json();
            if(!response.ok){
                await interaction.deleteReply();
                const errorMessage ='Could not retrieve loadout.'
                console.log(errorMessage);
                interaction.user.send(errorMessage);
                return
            }
            imageAttachments.push(
                {
                    attachment: data.loadout,  
                    name: extractNameFromURL(data.loadout)
                },
            )

        }
		
		if(interaction.options.getString('on-completion')){
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: interaction.options.getString('on-completion'), files:imageAttachments});
			}else{
				await interaction.editReply({content: interaction.options.getString('on-completion'), files:imageAttachments});
			}
		}else{
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: DEFAULT_COMPLETION_MESSAGE, files:imageAttachments});
			}else{
				await interaction.editReply({content: DEFAULT_COMPLETION_MESSAGE, files:imageAttachments});
			}
		}

		console.log('\n----------------Random Loadout Sent.')
	},
};