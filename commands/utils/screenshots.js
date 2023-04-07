const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');

const postGenerationResponseMessage = 'Recent NMS Waves Screenshots:';
module.exports = {
	data: new SlashCommandBuilder()
		.setName('screenshots')
		.setDescription('Posts generated screenshots if they exist.')
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
		await interaction.deferReply();
		const origin = 'https://gotlegends.info';
		let screenshotsLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret);
		if(screenshotsLinks.status){
			const errorMessage = `Sceenshots may have not been generated, resposnsded with ${screenshotsLinks.status}:${screenshotsLinks.statusText}`;
			console.log(errorMessage);
			await interaction.editReply(errorMessage);
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
		await interaction.editReply({content: postGenerationResponseMessage, files: imageAttachments});
		console.log('\n----------------Screenshots sent.')
	},
};