const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const COOL_DDOWN = 10
const DEFAULT_COMPLETION_MESSAGE = 'Recent NMS Waves Screenshots:';
module.exports = {
	coooldown: COOL_DDOWN,
	data: new SlashCommandBuilder()
		.setName('screenshots')
		.setDescription('Posts generated screenshots if they exist.')
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
			option.setName('exception-1')
			.setDescription('Choose a screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
		.addStringOption( option => 
			option.setName('exception-2')
			.setDescription('Choose a 2nd screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
		.addStringOption( option => 
			option.setName('exception-3')
			.setDescription('Choose a 3rd screenshot to exclude.')
			.addChoices(
				{name: 'infograph', value: 'infograph.png'},
				{name: 'infograph-nf', value: '-nofooter.png'},
				{name: 'table', value: 'table'},
				{name: 'omv-d', value: 'omv-d'},
				{name: 'omv-l', value: 'omv-l'},
			)
		)
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
		let imageAttachments = [];
		const exclusions = [
			await interaction.options.getString('exception-1'),
			await interaction.options.getString('exception-2'),
			await interaction.options.getString('exception-3'),
		]
		console.log(`Exclude ${exclusions}`);
		Object.values(screenshotsLinks).filter(screenshot => !screenshot.includes(exclusions[0]) && !screenshot.includes(exclusions[1]) && !screenshot.includes(exclusions[2])).forEach( async (link,index) => {
			let fullURL = 'https://gotlegends.info'+link;
			imageAttachments.push({attachment: fullURL, name: extractNameFromURL(fullURL)});
		})
		if(interaction.options.getString('on-completion')){
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: interaction.options.getString('on-completion'), files: imageAttachments});
			}else{
				await interaction.editReply({content: interaction.options.getString('on-completion'), files: imageAttachments});
			}
		}else{
			if(interaction.options.getChannel('channel')){
				await interaction.deleteReply();
				interaction.options.getChannel('channel').send({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
			}else{
				await interaction.editReply({content: DEFAULT_COMPLETION_MESSAGE, files: imageAttachments});
			}
		}
		console.log('\n----------------Screenshots sent.')
	},
};