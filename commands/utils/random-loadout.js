const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const COOL_DDOWN = 0;
const DEFAULT_COMPLETION_MESSAGE = 'Random Build:';

module.exports = {
	cooldown: COOL_DDOWN,
	data: new SlashCommandBuilder()
		.setName('random-loadout')
		.setDescription('Retrieve a random loadout\'s screenshot.')
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
			option.setName('fix-class')
			.setDescription('Retrieve random build by a certain class.')
            .addChoices(
                { name: 'Samurai', value: '1' },
                { name: 'Hunter', value: '2' },
                { name: 'Ronin', value: '3' },
                { name: 'Assassin', value: '4' },
            )
		)
        .addStringOption( option => 
			option.setName('fix-username')
			.setDescription('Retrieve random build by a certain username.')
		)
        .addBooleanOption(option =>
			option.setName('random-squad')
			.setDescription('Retrieve 4 random distinct class builds.')
		)
		,
	async execute(interaction) {
		await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});
		const origin = 'https://gotlegends.info';
		// let screenshotsLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret);
		// if(screenshotsLinks.status){
		// 	await interaction.deleteReply();
		// 	const errorMessage = `Sceenshots may have not been generated, resposnsded with ${screenshotsLinks.status}:${screenshotsLinks.statusText}`;
		// 	console.log(errorMessage);
		// 	interaction.user.send(errorMessage);
		// 	return
		// }

		let imageAttachments = [];

        console.log('Requesting random loadout option...');
        if(interaction.options.getBoolean('random-squad')){
		    let response = await fetch('https://gotlegends.info/community-builds/random-squad');
		    let data = await response.json();
            if(!response.ok){
                await interaction.deleteReply();
                const errorMessage ='Could not retrieve loadouts.'
                console.log(errorMessage);
                interaction.user.send(errorMessage);
                return
            }
            imageAttachments.push(
                {
                    attachment: data.samurai,  
                    name: extractNameFromURL(data.samurai)
                },
                {
                    attachment: data.hunter,  
                    name: extractNameFromURL(data.hunter)
                },
                {
                    attachment: data.ronin,  
                    name: extractNameFromURL(data.ronin)
                },
                {
                    attachment: data.assassin,  
                    name: extractNameFromURL(data.assassin)
                },
            )
        }else if(interaction.options.getString('fix-class')){
            let response = await fetch('https://gotlegends.info/community-builds/random-class?player_class_id='+ interaction.options.getString('fix-class'));
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
                    attachment: data.randomLoadout,  
                    name: extractNameFromURL(data.randomLoadout)
                },
            )

        }else if(interaction.options.getString('fix-username')){
            let response = await fetch('https://gotlegends.info/community-builds/random-user?username='+ interaction.options.getString('fix-username'));
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
                    attachment: data.randomLoadout,  
                    name: extractNameFromURL(data.randomLoadout)
                },
            )

        }else{
            let response = await fetch('https://gotlegends.info/community-builds/random');
		    let data = await response.json();
            console.log(response);
            if(!response.ok){
                await interaction.deleteReply();
                const errorMessage ='Could not retrieve loadout.'
                console.log(errorMessage);
                interaction.user.send(errorMessage);
                return
            }
            imageAttachments.push(
                {
                    attachment: data.randomLoadout,  
                    name: extractNameFromURL(data.randomLoadout)
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