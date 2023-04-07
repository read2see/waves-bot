const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { fetchResource, extractNameFromURL } = require('../../helpers.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('table')
		.setDescription('Posts NMS Waves table.'),
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
		let fullURL = origin + screenshotsLinks.table;
		const imageAttachment = {
			attachment: fullURL,  
			name: extractNameFromURL(fullURL)
		}
		try{
			await interaction.editReply({content: 'Recent table:', files:[imageAttachment]})
			console.log('\n----------------Recent table screenshot sent.')
		}catch(error){
			console.log(`Failed to reply!\n ${error}`);
		};
	},
};