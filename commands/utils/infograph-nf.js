const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const COOL_DDOWN = 10
const DEFAULT_COMPLETION_MESSAGE = 'Recent Infograph-nofooter:';

module.exports = {
	coooldown: COOL_DDOWN,
	data: new SlashCommandBuilder()
		.setName('infograph-nf')
		.setDescription('Posts NMS Waves Infograph without footer.')
		.addStringOption( option => 
			option.setName('on-completion')
			.setDescription('Set custom completion message.')
			
		)
		.addBooleanOption(option =>
			option.setName('visible-only-to-me')
			.setDescription('Set the bots message visibility to yourself alone.')
		)
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to reply at. defaults to current channel.'))
		,
	async execute(interaction) {
		await interaction.deferReply({ephemeral: interaction.options.getBoolean('visible-only-to-me')});
		const origin = 'https://gotlegends.info';
		let screenshotsLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret);
		if(screenshotsLinks.status){
			await interaction.deleteReply();
			const errorMessage = `Sceenshots may have not been generated, resposnsded with ${screenshotsLinks.status}:${screenshotsLinks.statusText}`;
			console.log(errorMessage);
			interaction.user.send(errorMessage);
			return
		}
		let fullURL = origin + screenshotsLinks.infograph_nofooter;
		const imageAttachment = {
			attachment: fullURL,  
			name: extractNameFromURL(fullURL)
		}
		if(interaction.options.getString('on-completion')){
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: interaction.options.getString('on-completion'), files:[imageAttachment]});
			}else{
				await interaction.editReply({content: interaction.options.getString('on-completion'), files:[imageAttachment]});
			}
		}else{
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: DEFAULT_COMPLETION_MESSAGE, files:[imageAttachment]});
			}else{
				await interaction.editReply({content: DEFAULT_COMPLETION_MESSAGE, files:[imageAttachment]});
			}
		}

		console.log('\n----------------Infograph without footer screenshot sent.')
	},
};