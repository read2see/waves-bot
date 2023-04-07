const { SlashCommandBuilder } = require('discord.js');
const { api_secret } = require('../../config.json');
const { formatRawZones, fetchResource, extractNameFromURL, countdown, postData } = require('../../helpers.js');

const delay = 45000;
const postGenerationResponseMessage = 'NMS Waves Screenshots:';

module.exports = {
	data: new SlashCommandBuilder()
			.setName('update')
			.setDescription('Update using the message that initiated the command for data input.')
			.addIntegerOption(option =>
				option.setName('week')
					.setDescription('Current week.')
					.setRequired(true)
					.addChoices(
						{name: '1', value: 1},
						{name: '2', value: 2},
						{name: '3', value: 3},
						{name: '4', value: 4},
						{name: '5', value: 5},
						{name: '6', value: 6},
						{name: '7', value: 7},
						{name: '8', value: 8},
						)
				)
			.addIntegerOption( option => 
				option.setName('title')
					.setDescription('Map title.')
					.setRequired(true)
					.addChoices(
						{name: 'The Shores of Vengeance', value: 1 },
						{name: 'The Defense of Aoi Village', value: 2 },
						{name: 'The Shadows of War', value: 3 },
						{name: 'Blood in the Snow', value: 4 },
						{name: 'Twilight and Ashes', value: 5 },
						{name: 'Blood and Steel', value: 6 },
					)
				)
			.addIntegerOption(option => 
				option.setName('modifier')
					.setDescription('Weekly modifier.')
					.setRequired(true)
					.addChoices(
						{name: 'Slowed Revives', value: 1 },
						{name: 'Tool Shortage', value: 3 },
						{name: 'Immunity', value: 4 },
						{name: 'Reduced Healing', value: 9 },
						{name: 'Empowered Foes', value: 10 },
						{name: 'Incapicitated', value: 11 },
						{name: 'Barbed Arrows', value: 12 },
					 )
				)
			.addIntegerOption(option => 
				option.setName('hazard')
					.setDescription('Weekly hazard.')
					.setRequired(true)
					.addChoices( 
						{name: 'Fire Spirits', value: 13 },
						{name: 'Eyes of Iyo', value: 14 },
						{name: 'Disciples Of Iyo', value: 15 },
					 )
				)
			.addStringOption(option => 
				option.setName('zones')
					.setDescription('The zones in order.')
					.setRequired(true)
				)
			.addStringOption(option => 
				option.setName('credits')
					.setDescription('Players that took the time to note it down.')
				)
			.addNumberOption(option => 
				option.setName('version')
					.setDescription('Game version.')
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

		await interaction.deferReply();

		console.log("Preparing data to be sent...");
		let data = {
			username: 'waves-bot',
			week: await interaction.options.getInteger('week'),
			map_id: await interaction.options.getInteger('title'),
			modifier_id: await interaction.options.getInteger('modifier'),
			hazard_id: await interaction.options.getInteger('hazard'),
			zones: formatRawZones(await interaction.options.getString('zones')),
			credits: await interaction.options.getString('credits'),
			version: await interaction.options.getNumber('version')
		}
		
		console.log("Sending request...");
		if(data.zones.split('\n').join(',').split(',').length < 44){
			await interaction.reply(`Oni lord tracked me and something went wrong. Only tracked ${data.zones.split('\n').join(',').split(',').length} zones.` );
			interaction.user.send('Missing some zones, the matching process may have failed to catch your format, double check your inputs and try again.');
			console.log(`Zones came up short ${data.zones.split('\n').join(',').split(',').length} < ${44}.`);
			return
		}

        let response = await postData(data, api_secret);
		await interaction.editReply(`Generating screenshots ETA ${delay/1000}s.`);

		if(!response.ok){
			interaction.user.send(`Request failed. Server response: ${response.status} | ${response.statusText} , something went wrong somewhere try again after 120s.`)
			console.log(`Response Status: ${response.status}| ${response.statusText}`);
		}else{

			console.log('Request was sent successfully.');
			countdown('Time Remaining before sending screenshots', delay-3000);

			setTimeout( async () => {

				try {
					const generatedLinks = await fetchResource('https://gotlegends.info/bot/nms-order/generated_screenshots', api_secret);
					let linksMessage = "";
					let imageAttachments = [];
					if(generatedLinks){
						const exclusions = [
							await interaction.options.getString('exception-1'),
							await interaction.options.getString('exception-2'),
							await interaction.options.getString('exception-3'),
						]
						console.log(`Exclude ${exclusions}`);
						Object.values(generatedLinks).filter(screenshot => !screenshot.includes(exclusions[0]) && !screenshot.includes(exclusions[1]) && !screenshot.includes(exclusions[2])).forEach( async (link,index) => {
							let fullURL = 'https://gotlegends.info'+link;
							linksMessage = linksMessage.concat(fullURL+"\n");
							imageAttachments.push({attachment: fullURL, name: extractNameFromURL(fullURL)});
						})
						await interaction.editReply({content: postGenerationResponseMessage, files: imageAttachments});
						console.log('\n----------------Screenshots sent.')
					}
				} catch (error) {

					console.error(`Failed to send images to ${channel.name}: ${error}`);
					interaction.user.send(`Failed to send images to ${channel.name}.`);

				}

			},
			delay
			)
		}

	},
};

// Auto assign choices, requires command deployment to be async and all commands data to be refactored to a function
// data: async () => {		
// 	const apiData = await getApiData(api_secret);
// 	return new SlashCommandBuilder()
// 		.setName('update-deprecated')
// 		.setDescription('Update using the message that initiated the command for data input.')
// 		.addIntegerOption(option =>
// 			option.setName('week')
// 				.setDescription('Current week.')
// 				.setRequired(true)
// 				.addChoices(
// 					{name: '1', value: 1},
// 					{name: '2', value: 2},
// 					{name: '3', value: 3},
// 					{name: '4', value: 4},
// 					{name: '5', value: 5},
// 					{name: '6', value: 6},
// 					{name: '7', value: 7},
// 					{name: '8', value: 8},
// 					)
// 			)
// 		.addIntegerOption( option => 
// 			option.setName('title')
// 				.setDescription('Map title.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.maps.map((object =>{ return {name: object.title, value: object.id}})))
// 			)
// 		.addIntegerOption(option => 
// 			option.setName('modifier')
// 				.setDescription('Weekly modifier.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.modifiers.map((object =>{ return {name: object.title, value: object.id}})) )
// 			)
// 		.addIntegerOption(option => 
// 			option.setName('hazard')
// 				.setDescription('Weekly hazard.')
// 				.setRequired(true)
// 				.addChoices( ...apiData.hazards.map((object =>{ return {name: object.title, value: object.id}})) )
// 			)
// 		.addStringOption(option => 
// 			option.setName('zones')
// 				.setDescription('The zones in order.')
// 				.setRequired(true)
// 			)
// 		.addStringOption(option => 
// 			option.setName('credits')
// 				.setDescription('Players that took the time to note it down.')
// 			)
// }